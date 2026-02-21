"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface StackedCardsProps {
  items: string[];
  className?: string;
  autoplay?: boolean;
}

const isVideo = (src: string) => {
  if (!src) return false;
  const lower = src.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");
};

/** Hero: front video plays; back cards show video thumbnails; when front ends, next plays. */
export const StackedCards = ({ items, className, autoplay = true }: StackedCardsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const frontVideoRef = useRef<HTMLVideoElement | null>(null);
  const playWithSoundAttempted = useRef(false);

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

  // Play front video when active index changes or on mount
  useEffect(() => {
    if (!items?.length || !activeIsVideo || !effectiveAutoplay) return;
    const video = frontVideoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.load();
    const tryPlay = () => {
      const tryUnmuted = !playWithSoundAttempted.current;
      if (tryUnmuted) playWithSoundAttempted.current = true;
      video.muted = tryUnmuted ? false : isMuted;
      video
        .play()
        .then(() => {
          if (!video.muted) setIsMuted(false);
        })
        .catch(() => {
          video.muted = true;
          video.play().catch(() => {});
          setIsMuted(true);
        });
    };
    const t = setTimeout(tryPlay, 100);
    return () => clearTimeout(t);
  }, [activeIndex, effectiveAutoplay]);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = frontVideoRef.current;
          if (!video || !activeIsVideo) return;
          if (!entry.isIntersecting) {
            video.pause();
          } else if (effectiveAutoplay) {
            video.muted = isMuted;
            video.play().catch(() => {});
          }
        });
      },
      { threshold: 0.2 }
    );
    const el = document.querySelector(".perspective-1000");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [activeIndex, activeIsVideo, effectiveAutoplay, isMuted]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (frontVideoRef.current) {
      const next = !frontVideoRef.current.muted;
      frontVideoRef.current.muted = next;
      setIsMuted(next);
      if (!next) {
        window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "hero-stacked-cards" } }));
      }
    }
  };

  const handleItemClick = (index: number) => {
    if (index !== activeIndex) setActiveIndex(index);
  };

  const handleFrontVideoEnded = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  if (!items?.length) return null;

  return (
    <div
      className={cn("relative w-full h-full perspective-1000 flex items-center justify-center group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full opacity-60 pointer-events-none -z-10" />
      <div className="relative w-full h-full">
        {items.map((src, index) => {
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

          const isItemVideo = isVideo(src);

          return (
            <motion.div
              key={`${src}-${index}`}
              className={cn(
                "absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 ease-out border-4 border-white/20 bg-black",
                isFirst ? "cursor-default" : "cursor-pointer hover:brightness-110"
              )}
              style={{ zIndex, transformOrigin: "center bottom" }}
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
                    loop={false}
                    preload="auto"
                    onEnded={handleFrontVideoEnded}
                  />
                ) : (
                  <img src={activeSrc} alt="Gallery" className="w-full h-full object-cover" />
                )
              ) : isItemVideo ? (
                <video
                  src={src}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden
                />
              ) : (
                <img src={src} alt="Gallery" className="w-full h-full object-cover" />
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
