"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeHeroEmbedUrl, getYouTubeThumbnail, isYouTubeValue } from "@/lib/youtube";
import { optimizeMediaUrl } from "@/lib/mediaDelivery";

export const HERO_STACK_PLACEHOLDER = "__hero_empty_slot__";

export const isHeroStackPlaceholder = (src: string) =>
  !src?.trim() || src === HERO_STACK_PLACEHOLDER;

const protectedImgProps = {
  draggable: false as const,
  "data-protected-media": "",
  onContextMenu: (e: React.MouseEvent<HTMLImageElement>) => e.preventDefault(),
};

interface StackedCardsProps {
  /** First item = video URL, rest = image URLs. In hero mode only one video is used and it loops. */
  items: string[];
  className?: string;
  autoplay?: boolean;
  /** When true: stacked hero layout with up to 3 items. */
  heroMode?: boolean;
  /** With heroMode: advance to next item when front video ends (no loop). Tap back cards to switch. */
  cycleOnEnd?: boolean;
  /** Heritage editorial styling — softer stack, no glow, refined borders */
  editorial?: boolean;
}

const isVideoFile = (src: string) => {
  if (!src) return false;
  const lower = src.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");
};

function HeroPlaceholderSlot() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/40">
      <Film className="h-9 w-9 text-muted-foreground/45" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

/** Paused first-frame preview for hero side stack slots (no blank white video box). */
function HeroSidePreview({ src }: { src: string }) {
  if (isHeroStackPlaceholder(src)) {
    return <HeroPlaceholderSlot />;
  }
  if (isYouTubeValue(src)) {
    return (
      <img
        src={getYouTubeThumbnail(src)}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        {...protectedImgProps}
      />
    );
  }

  if (isVideoFile(src)) {
    return (
      <video
        src={src}
        className="h-full w-full object-cover bg-black"
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        aria-hidden
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          if (video.currentTime < 0.05) {
            video.currentTime = Math.min(0.35, video.duration > 0 ? video.duration * 0.04 : 0.35);
          }
        }}
      />
    );
  }

  return (
    <img
      src={optimizeMediaUrl(src, { preset: "card" })}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      {...protectedImgProps}
    />
  );
}

/** Hero mode: 1 video (front, loops) + 2 images (back). No cycling. Optimized for smooth playback. */
export const StackedCards = ({
  items,
  className,
  autoplay = true,
  heroMode = false,
  cycleOnEnd = false,
  editorial = false,
}: StackedCardsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  // Start with sound by default. If the browser blocks autoplay with sound,
  // we fall back to muted automatically.
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [playbackLockedByOtherVideo, setPlaybackLockedByOtherVideo] = useState(false);
  const frontVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stackItems = useMemo(
    () => items.filter((src) => typeof src === "string"),
    [items],
  );
  const playableIndexes = useMemo(
    () => stackItems.map((src, i) => (isHeroStackPlaceholder(src) ? -1 : i)).filter((i) => i >= 0),
    [stackItems],
  );

  useEffect(() => {
    if (playableIndexes.length === 0) return;
    setActiveIndex((prev) => (playableIndexes.includes(prev) ? prev : playableIndexes[0]));
  }, [playableIndexes]);

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
  const activeSrc = stackItems[activeIndex];
  const activeIsYouTube = !!activeSrc && isYouTubeValue(activeSrc);
  const activeIsVideoFile = !!activeSrc && isVideoFile(activeSrc);
  const activeIsVideo = activeIsYouTube || activeIsVideoFile;

  const isMediaVideo = (src: string) => isVideoFile(src) || isYouTubeValue(src);
  const isBackImage = (src: string, index: number) =>
    heroMode && !cycleOnEnd ? index > 0 : !isMediaVideo(src);

  // Reliable autoplay: try playing with the current mute state.
  const tryPlay = useRef(() => {
    const video = frontVideoRef.current;
    if (!video || !activeIsVideoFile || !effectiveAutoplay) return;
    video.muted = isMuted;
    const p = video.play();
    if (p && typeof p.then === "function") {
      p.catch(() => {
        // Browser blocked autoplay with sound; fall back to muted.
        video.muted = true;
        video.play().catch(() => {});
        setIsMuted(true);
      });
    }
  });

  useEffect(() => {
    tryPlay.current = () => {
      const video = frontVideoRef.current;
      if (!video || !activeIsVideoFile || !effectiveAutoplay) return;
      video.muted = isMuted;
      video.play().then(() => {
        if (!video.muted) setIsMuted(false);
      }).catch(() => {
        // Browser blocked autoplay with sound; fall back to muted.
        video.muted = true;
        video.play().catch(() => {});
        setIsMuted(true);
      });
    };
  }, [activeIsVideoFile, effectiveAutoplay, isMuted]);

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
    if (!playableIndexes.length || !activeIsVideoFile || !effectiveAutoplay) return;
    if (playbackLockedByOtherVideo) return;
    const video = frontVideoRef.current;
    if (!video) return;
    const t = setTimeout(() => tryPlay.current(), 100);
    return () => clearTimeout(t);
  }, [activeIndex, effectiveAutoplay, activeSrc, activeIsVideoFile, playbackLockedByOtherVideo]);

  // Hero: when user brings another clip to the front, start playback automatically
  useEffect(() => {
    if (!heroMode || !cycleOnEnd || playbackLockedByOtherVideo || !effectiveAutoplay) return;
    if (!activeIsVideoFile) return;
    const t = window.setTimeout(() => tryPlay.current(), 200);
    return () => window.clearTimeout(t);
  }, [
    activeIndex,
    heroMode,
    cycleOnEnd,
    activeIsVideoFile,
    activeSrc,
    playbackLockedByOtherVideo,
    effectiveAutoplay,
  ]);

  // Pause when out of view, play when in view
  useEffect(() => {
    const video = frontVideoRef.current;
    if (!video || !activeIsVideoFile) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting);
        if (!entry.isIntersecting) {
          video.pause();
        } else if (effectiveAutoplay && !playbackLockedByOtherVideo) {
          tryPlay.current();
        }
      },
      // Pause when the hero is mostly off-screen.
      { threshold: 0.4, rootMargin: "0px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [activeIsVideoFile, effectiveAutoplay, playbackLockedByOtherVideo]);

  // Hero mode: pause video when it's on the side (user clicked an image to front)
  useEffect(() => {
    if (!heroMode || activeIsVideoFile) return;
    const video = frontVideoRef.current;
    if (video) video.pause();
  }, [heroMode, activeIsVideoFile, activeIndex]);

  useEffect(() => {
    const handleExclusivePlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.origin === "hero-stacked-cards") return;
      setPlaybackLockedByOtherVideo(true);
      const video = frontVideoRef.current;
      if (video) video.pause();
    };
    window.addEventListener("video-exclusive-play", handleExclusivePlay);
    return () => window.removeEventListener("video-exclusive-play", handleExclusivePlay);
  }, []);

  useEffect(() => {
    if (!heroMode) return;
    const onRelease = () => {
      setPlaybackLockedByOtherVideo(false);
      if (!effectiveAutoplay || !activeIsVideoFile || !isInView) return;
      tryPlay.current();
    };
    window.addEventListener("video-exclusive-release", onRelease);
    return () => window.removeEventListener("video-exclusive-release", onRelease);
  }, [heroMode, effectiveAutoplay, activeIsVideoFile, isInView]);

  const handleItemClick = (index: number) => {
    if (index === activeIndex || isHeroStackPlaceholder(stackItems[index])) return;
    setActiveIndex(index);
  };

  const advanceToNext = () => {
    if (playableIndexes.length === 0) return;
    setActiveIndex((prev) => {
      const currentPos = playableIndexes.indexOf(prev);
      const nextPos = currentPos >= 0 ? (currentPos + 1) % playableIndexes.length : 0;
      return playableIndexes[nextPos];
    });
  };

  const handleFrontVideoEnded = () => {
    if (heroMode && !cycleOnEnd) return;
    if (!activeIsVideoFile) return;
    advanceToNext();
  };

  // When front is a still image, auto-advance after a short beat
  useEffect(() => {
    if (!cycleOnEnd || activeIsVideoFile || activeIsYouTube) return;
    const t = window.setTimeout(() => {
      advanceToNext();
    }, 4500);
    return () => window.clearTimeout(t);
  }, [activeIndex, cycleOnEnd, activeIsVideoFile, activeIsYouTube, playableIndexes.length]);

  if (!stackItems.length) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative flex h-full w-full items-center justify-center perspective-1000",
        heroMode && "overflow-visible",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!editorial ? (
        <div className="absolute top-1/2 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 opacity-60 blur-[100px] pointer-events-none" />
      ) : null}
      <div className={cn("relative h-full w-full", heroMode && "overflow-visible")}>
        {stackItems.map((src, index) => {
          const isPlaceholder = isHeroStackPlaceholder(src);
          // In hero mode too, use activeIndex so clicked card comes to front and others go to sides
          const relativeIndex = (index - activeIndex + stackItems.length) % stackItems.length;
          const isFirst = relativeIndex === 0;
          const spreadDistance = editorial
            ? heroMode
              ? isMobile
                ? 28
                : isHovered
                  ? 62
                  : 50
              : isMobile
                ? 24
                : isHovered
                  ? 52
                  : 36
            : isMobile
              ? 30
              : isHovered
                ? 80
                : 50;
          const rotationAngle = editorial
            ? isMobile
              ? 2
              : isHovered
                ? 7
                : 4
            : isMobile
              ? 3
              : isHovered
                ? 12
                : 6;

          let xOffset = 0;
          let rotation = 0;
          let scale = 1;
          let zIndex = 0;
          if (isFirst) {
            zIndex = 10;
            scale = 1;
          } else if (relativeIndex === 1) {
            xOffset = -spreadDistance;
            rotation = -rotationAngle;
            zIndex = 5;
            scale = editorial ? 0.93 : 0.95;
          } else if (relativeIndex === 2) {
            xOffset = spreadDistance;
            rotation = rotationAngle;
            zIndex = 5;
            scale = editorial ? 0.93 : 0.95;
          } else {
            zIndex = 0;
            scale = editorial ? 0.88 : 0.9;
          }

          const renderAsImage = isBackImage(src, index);

          return (
            <motion.div
              key={heroMode ? `hero-${index}-${src}` : `${src}-${index}`}
              className={cn(
                "absolute inset-0 overflow-hidden transition-all duration-500 ease-out bg-black",
                editorial
                  ? "rounded-[1.35rem] border border-border/60 shadow-[0_10px_28px_-10px_rgba(26,24,22,0.2)]"
                  : "rounded-[2rem] border-4 border-white/20 shadow-2xl",
                isFirst || isPlaceholder
                  ? "cursor-default"
                  : "cursor-pointer hover:brightness-110",
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleItemClick(index);
                }
              }}
              role={isFirst || isPlaceholder ? undefined : "button"}
              tabIndex={isFirst || isPlaceholder ? undefined : 0}
              aria-label={isFirst || isPlaceholder ? undefined : `Show clip ${index + 1}`}
            >
              {isFirst ? (
                isPlaceholder ? (
                  <HeroPlaceholderSlot />
                ) : activeIsVideoFile ? (
                  <video
                    ref={frontVideoRef}
                    key={activeSrc}
                    src={activeSrc}
                    className="h-full w-full bg-black object-cover"
                    muted={isMuted}
                    playsInline
                    loop={heroMode && !cycleOnEnd}
                    preload="metadata"
                    autoPlay={heroMode || cycleOnEnd}
                    onCanPlay={handleCanPlay}
                    onLoadedData={handleLoadedData}
                    onEnded={handleFrontVideoEnded}
                    disablePictureInPicture
                    disableRemotePlayback
                  />
                ) : activeIsYouTube ? (
                  <div className="relative h-full w-full bg-black">
                    {playbackLockedByOtherVideo ? (
                      <img
                        src={getYouTubeThumbnail(activeSrc)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                        {...protectedImgProps}
                      />
                    ) : (
                      <iframe
                        key={`${activeIndex}-${activeSrc}`}
                        src={getYouTubeHeroEmbedUrl(activeSrc, true)}
                        className="pointer-events-none absolute inset-0 h-full w-full border-0 object-cover"
                        allow="autoplay; encrypted-media"
                        title="YouTube video"
                        tabIndex={-1}
                      />
                    )}
                  </div>
                ) : (
                  <img
                    src={optimizeMediaUrl(activeSrc, { preset: "card" })}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    {...protectedImgProps}
                  />
                )
              ) : heroMode ? (
                <HeroSidePreview src={src} />
              ) : renderAsImage ? (
                <img
                  src={optimizeMediaUrl(src, { preset: "card" })}
                  alt="Gallery image"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  {...protectedImgProps}
                />
              ) : isYouTubeValue(src) ? (
                <img
                  src={getYouTubeThumbnail(src)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  {...protectedImgProps}
                />
              ) : (
                <video
                  ref={heroMode && index === 0 ? frontVideoRef : undefined}
                  src={src}
                  className="h-full w-full bg-black object-cover"
                  muted
                  playsInline
                  preload={heroMode ? "metadata" : "none"}
                  aria-hidden
                />
              )}
              {!isFirst ? (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    editorial ? "bg-black/10" : "bg-black/20",
                  )}
                />
              ) : null}

              {isFirst && activeIsVideo && !editorial ? (
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
