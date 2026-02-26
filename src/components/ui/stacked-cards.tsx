"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface StackedCardsProps {
  /** First item = video URL, rest = image URLs. In hero mode only one video is used and it loops. */
  items: string[];
  className?: string;
  autoplay?: boolean;
  /** When true: items = [video, image1, image2]. Front = single video (loops), back = images only. No cycling. */
  heroMode?: boolean;
}

const isVideo = (src: string) => {
  if (!src) return false;
  const lower = src.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");
};

/** Hero mode: 1 video (front, loops) + 2 images (back). No cycling. Optimized for smooth playback. */
export const StackedCards = ({ items, className, autoplay = true, heroMode = false }: StackedCardsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Start muted so autoplay works (browser policy)
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const frontVideoRef = useRef<HTMLVideoElement | null>(null);
  const playWithSoundAttempted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const effectiveAutoplay = autoplay && !prefersReducedMotion;
  const activeSrc = items[activeIndex];
  const activeIsVideo = activeSrc && isVideo(activeSrc);

  // Hero mode: only one video (index 0), back cards are always images
  const isBackImage = (src: string, index: number) => heroMode ? index > 0 : !isVideo(src);

  // Reliable autoplay: start muted (required by browsers), play when video is ready and in view
  const tryPlay = useRef(() => {
    const video = frontVideoRef.current;
    if (!video || !activeIsVideo || !effectiveAutoplay) return;
    video.muted = true; // Required for autoplay without user gesture
    const p = video.play();
    if (p && typeof p.then === "function") {
      p.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  });

  useEffect(() => {
    tryPlay.current = () => {
      const video = frontVideoRef.current;
      if (!video || !activeIsVideo || !effectiveAutoplay) return;
      video.muted = playWithSoundAttempted.current ? isMuted : true;
      video.play().then(() => {
        if (!video.muted) setIsMuted(false);
      }).catch(() => {
        video.muted = true;
        video.play().catch(() => {});
        setIsMuted(true);
      });
    };
  }, [activeIsVideo, effectiveAutoplay, isMuted]);

  // When video is ready to play (has enough data), start playback
  const handleCanPlay = () => {
    tryPlay.current();
  };

  // Also try play when first frame is loaded (faster start on slow connections)
  const handleLoadedData = () => {
    tryPlay.current();
  };

  // Initial play attempt after mount (video may already be in view)
  useEffect(() => {
    if (!items?.length || !activeIsVideo || !effectiveAutoplay) return;
    const video = frontVideoRef.current;
    if (!video) return;
    const t = setTimeout(() => tryPlay.current(), 100);
    return () => clearTimeout(t);
  }, [activeIndex, effectiveAutoplay, activeSrc]);

  // Pause when out of view, play when in view
  useEffect(() => {
    const video = frontVideoRef.current;
    if (!video || !activeIsVideo) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (!entry.isIntersecting) {
          video.pause();
        } else if (effectiveAutoplay) {
          tryPlay.current();
        }
      },
      { threshold: 0.2, rootMargin: "80px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [activeIsVideo, effectiveAutoplay]);

  // Hero mode: pause video when it's on the side (user clicked an image to front)
  useEffect(() => {
    if (!heroMode || activeIsVideo) return;
    const video = frontVideoRef.current;
    if (video) video.pause();
  }, [heroMode, activeIsVideo, activeIndex]);

  useEffect(() => {
    const handleExclusivePlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.origin !== "hero-stacked-cards") {
        setIsMuted(true);
        if (frontVideoRef.current) frontVideoRef.current.muted = true;
      }
    };
    window.addEventListener("video-exclusive-play", handleExclusivePlay);
    return () => window.removeEventListener("video-exclusive-play", handleExclusivePlay);
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (frontVideoRef.current) {
      const next = !frontVideoRef.current.muted;
      frontVideoRef.current.muted = next;
      setIsMuted(next);
      playWithSoundAttempted.current = true;
      if (!next) {
        window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "hero-stacked-cards" } }));
      }
    }
  };

  const handleItemClick = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  };

  const handleFrontVideoEnded = () => {
    if (heroMode) return; // Hero: video loops, no cycling
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  if (!items?.length) return null;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full perspective-1000 flex items-center justify-center group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full opacity-60 pointer-events-none -z-10" />
      <div className="relative w-full h-full">
        {items.map((src, index) => {
          // In hero mode too, use activeIndex so clicked card comes to front and others go to sides
          const relativeIndex = (index - activeIndex + items.length) % items.length;
          const isFirst = relativeIndex === 0;
          const spreadDistance = isMobile ? 30 : isHovered ? 80 : 50;
          const rotationAngle = isMobile ? 3 : isHovered ? 12 : 6;

          let xOffset = 0, rotation = 0, scale = 1, zIndex = 0;
          if (isFirst) {
            zIndex = 10;
            scale = 1;
          } else if (relativeIndex === 1) {
            xOffset = -spreadDistance;
            rotation = -rotationAngle;
            zIndex = 5;
            scale = 0.95;
          } else if (relativeIndex === 2) {
            xOffset = spreadDistance;
            rotation = rotationAngle;
            zIndex = 5;
            scale = 0.95;
          } else {
            zIndex = 0;
            scale = 0.9;
          }

          const renderAsImage = isBackImage(src, index);

          return (
            <motion.div
              key={heroMode ? `hero-${index}-${src}` : `${src}-${index}`}
              className={cn(
                "absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 ease-out border-4 border-white/20 bg-black",
                isFirst ? "cursor-default" : "cursor-pointer hover:brightness-110"
              )}
              style={{ zIndex, transformOrigin: "center bottom", willChange: "transform" }}
              animate={{
                x: xOffset,
                rotate: rotation,
                scale,
                opacity: relativeIndex > 2 ? 0 : 1,
              }}
              transition={{ duration: 0.4, ease: "backOut" }}
              onClick={() => handleItemClick(index)}
            >
              {isFirst ? (
                activeIsVideo ? (
                  <video
                    ref={frontVideoRef}
                    key={activeSrc}
                    src={activeSrc}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    playsInline
                    loop={heroMode}
                    preload={heroMode ? "auto" : "metadata"}
                    autoPlay={heroMode}
                    onCanPlay={handleCanPlay}
                    onLoadedData={handleLoadedData}
                    onEnded={handleFrontVideoEnded}
                    disablePictureInPicture
                    disableRemotePlayback
                  />
                ) : (
                  <img src={activeSrc} alt="Gallery" className="w-full h-full object-cover" loading="eager" decoding="async" />
                )
              ) : renderAsImage ? (
                <img src={src} alt="Gallery image" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <video
                  ref={heroMode && index === 0 ? frontVideoRef : undefined}
                  src={src}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="none"
                  aria-hidden
                />
              )}
              {!isFirst && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}

              {isFirst && activeIsVideo && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="pointer-events-auto absolute bottom-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-20 hover:scale-110"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
