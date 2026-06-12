"use client";

import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { Film, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeId, getYouTubeThumbnail, isYouTubeValue, YOUTUBE_NOCOOKIE_HOST } from "@/lib/youtube";
import { optimizeMediaUrl } from "@/lib/mediaDelivery";
import {
  REELS_EXCLUSIVE_EVENT,
  VIDEO_EXCLUSIVE_PLAY,
  claimVideoPlayback,
  closeAllReelsPlayers,
  ensureYouTubeIframeApiLoaded,
  normalizeYouTubeIframe,
  pauseAllSiteVideosExcept,
  releaseVideoPlayback,
} from "@/lib/videoPlaybackCoordinator";

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
  if (!src || isYouTubeValue(src)) return false;
  const lower = src.toLowerCase();
  return (
    /\.(mp4|webm|mov)(\?|$)/i.test(lower) ||
    lower.includes("content-media") ||
    lower.includes("/video")
  );
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

type HeroYouTubePlayerProps = {
  src: string;
  activeKey: string;
  shouldAutoplay: boolean;
  locked: boolean;
  cycleOnEnd: boolean;
  onEnded: () => void;
  onPlayingChange: (playing: boolean) => void;
  onUserPaused?: () => void;
  onUserPlay?: () => void;
};

/** YouTube hero clip with ended detection, exclusive playback, and tap-to-pause. */
function HeroYouTubePlayer({
  src,
  activeKey,
  shouldAutoplay,
  locked,
  cycleOnEnd,
  onEnded,
  onPlayingChange,
  onUserPaused,
  onUserPlay,
}: HeroYouTubePlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const endedHandledRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const shouldAutoplayRef = useRef(shouldAutoplay);
  const wantsAudioRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const videoId = getYouTubeId(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const thumbnailSrc = getYouTubeThumbnail(src);

  useEffect(() => {
    shouldAutoplayRef.current = shouldAutoplay;
    if (shouldAutoplay) wantsAudioRef.current = true;
  }, [shouldAutoplay]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onPlayingChangeRef.current = onPlayingChange;
  }, [onPlayingChange]);

  useEffect(() => {
    const onExclusive = (e: Event) => {
      const ev = e as CustomEvent;
      if (ev.detail?.origin === "hero-stacked-cards") return;
      try {
        playerRef.current?.pauseVideo?.();
      } catch {
        /* ignore */
      }
      setIsPlaying(false);
      onPlayingChangeRef.current(false);
    };
    window.addEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive);
    return () => {
      window.removeEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive);
    };
  }, []);

  const tryUnmutePlayer = useCallback(() => {
    if (!wantsAudioRef.current || !playerRef.current) return false;
    try {
      if (playerRef.current.isMuted?.()) {
        playerRef.current.unMute();
      }
      return !playerRef.current.isMuted?.();
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || !wantsAudioRef.current) return;

    tryUnmutePlayer();

    const onGesture = () => {
      if (tryUnmutePlayer()) {
        window.removeEventListener("pointerdown", onGesture, true);
        window.removeEventListener("keydown", onGesture, true);
      }
    };

    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
  }, [isPlaying, tryUnmutePlayer]);

  useLayoutEffect(() => {
    if (!videoId) return;

    let cancelled = false;
    endedHandledRef.current = false;
    pendingPlayRef.current = false;
    if (shouldAutoplayRef.current) wantsAudioRef.current = true;
    setPlayerReady(false);
    setIsPlaying(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    ensureYouTubeIframeApiLoaded()
      .then(() => {
        if (cancelled || !mountRef.current) return;

        const handleStateChange = (ev: { data?: number }) => {
          const YT = w.YT;
          if (ev?.data === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            onPlayingChangeRef.current(true);
            claimVideoPlayback("hero-stacked-cards", { slideId: activeKey });
            pauseAllSiteVideosExcept();
            closeAllReelsPlayers();
            if (wantsAudioRef.current) {
              tryUnmutePlayer();
            }
            return;
          }
          if (ev?.data === YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            onPlayingChangeRef.current(false);
            return;
          }
          if (ev?.data === YT.PlayerState.ENDED) {
            if (endedHandledRef.current) return;
            endedHandledRef.current = true;
            setIsPlaying(false);
            onPlayingChangeRef.current(false);
            releaseVideoPlayback();
            onEndedRef.current();
          }
        };

        const player = new w.YT.Player(mountRef.current, {
          host: YOUTUBE_NOCOOKIE_HOST,
          videoId,
          playerVars: {
            autoplay: shouldAutoplayRef.current ? 1 : 0,
            mute: shouldAutoplayRef.current && wantsAudioRef.current ? 0 : 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              playerRef.current = player;
              normalizeYouTubeIframe(player);
              setPlayerReady(true);
              if (pendingPlayRef.current || shouldAutoplayRef.current) {
                pendingPlayRef.current = false;
                try {
                  player.playVideo();
                  if (wantsAudioRef.current) {
                    try {
                      player.unMute?.();
                    } catch {
                      /* ignore */
                    }
                  }
                  // If unmuted autoplay was blocked, fall back to muted playback.
                  window.setTimeout(() => {
                    if (cancelled) return;
                    const state = player.getPlayerState?.();
                    if (state !== w.YT.PlayerState.PLAYING) {
                      try {
                        player.mute?.();
                        player.playVideo?.();
                      } catch {
                        /* ignore */
                      }
                    }
                  }, 350);
                } catch {
                  /* ignore */
                }
              }
            },
            onStateChange: handleStateChange,
          },
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      setPlayerReady(false);
      setIsPlaying(false);
    };
  }, [videoId, activeKey]);

  // Autoplay when conditions become true after player is ready.
  useEffect(() => {
    if (!playerReady || locked || !shouldAutoplay) return;
    try {
      if (wantsAudioRef.current) {
        playerRef.current?.unMute?.();
      }
      playerRef.current?.playVideo?.();
    } catch {
      /* ignore */
    }
  }, [playerReady, shouldAutoplay, locked, activeKey]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    if (!playerReady || !playerRef.current) {
      pendingPlayRef.current = true;
      wantsAudioRef.current = true;
      onUserPlay?.();
      return;
    }

    const state = playerRef.current.getPlayerState?.();
    if (state === w.YT.PlayerState.PLAYING) {
      if (playerRef.current.isMuted?.()) {
        wantsAudioRef.current = true;
        try {
          playerRef.current.unMute();
        } catch {
          /* ignore */
        }
        return;
      }
      playerRef.current.pauseVideo();
      releaseVideoPlayback();
      setIsPlaying(false);
      onPlayingChangeRef.current(false);
      onUserPaused?.();
      return;
    }

    wantsAudioRef.current = true;
    onUserPlay?.();
    claimVideoPlayback("hero-stacked-cards", { slideId: activeKey });
    pauseAllSiteVideosExcept();
    closeAllReelsPlayers();
    try {
      playerRef.current.unMute?.();
      playerRef.current.playVideo();
    } catch {
      /* ignore */
    }
  };

  const showOverlay = cycleOnEnd && !isPlaying;

  return (
    <div
      className={cn("relative h-full w-full bg-black", cycleOnEnd && "cursor-pointer")}
      onClick={cycleOnEnd ? handleToggle : undefined}
      role={cycleOnEnd ? "button" : undefined}
      tabIndex={cycleOnEnd ? 0 : undefined}
      onKeyDown={
        cycleOnEnd
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggle(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      aria-label={showOverlay ? "Play video" : isPlaying ? "Pause video" : undefined}
    >
      {/* pointer-events-none so clicks always reach the wrapper for play/pause */}
      <div ref={mountRef} className="pointer-events-none absolute inset-0 z-[1]" />
      {showOverlay && thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt=""
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover"
          loading="eager"
          decoding="async"
          {...protectedImgProps}
        />
      ) : null}
      {showOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center bg-black/15">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-black/35 shadow-lg backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Hero mode: stacked clips — cycleOnEnd advances and auto-plays the next item. */
export const StackedCards = ({
  items,
  className,
  autoplay = true,
  heroMode = false,
  cycleOnEnd = false,
  editorial = false,
}: StackedCardsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  // Prefer audio on hero; browsers may still require a muted fallback for autoplay.
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInView, setIsInView] = useState(() => heroMode);
  const [playbackLockedByOtherVideo, setPlaybackLockedByOtherVideo] = useState(false);
  const [isFrontPlaying, setIsFrontPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
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

  const shouldAutoplayFront =
    effectiveAutoplay && isInView && !playbackLockedByOtherVideo && !userPaused;

  // Hero claims playback before reels can lock it on page load.
  useLayoutEffect(() => {
    if (!heroMode || !effectiveAutoplay || userPaused || !activeIsVideo) return;
    claimVideoPlayback("hero-stacked-cards", { slideId: activeSrc });
  }, [heroMode, effectiveAutoplay, userPaused, activeIsVideo, activeSrc]);

  const startFrontFileVideo = useCallback((withAudio = true) => {
    const video = frontVideoRef.current;
    if (!video || !activeIsVideoFile) return;
    if (withAudio) {
      video.muted = false;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    video
      .play()
      .then(() => {
        setIsFrontPlaying(true);
        claimVideoPlayback("hero-stacked-cards", { slideId: activeSrc });
        pauseAllSiteVideosExcept(video);
        closeAllReelsPlayers();
      })
      .catch(() => {
        if (withAudio) {
          video.muted = true;
          setIsMuted(true);
        }
        video
          .play()
          .then(() => {
            setIsFrontPlaying(true);
            claimVideoPlayback("hero-stacked-cards", { slideId: activeSrc });
            pauseAllSiteVideosExcept(video);
            closeAllReelsPlayers();
          })
          .catch(() => {});
      });
  }, [activeIsVideoFile, activeSrc]);

  const tryPlay = useRef(startFrontFileVideo);
  useEffect(() => {
    tryPlay.current = startFrontFileVideo;
  }, [startFrontFileVideo]);

  const handleCanPlay = () => {
    if (shouldAutoplayFront) tryPlay.current(true);
  };

  const handleLoadedData = () => {
    if (shouldAutoplayFront) tryPlay.current(true);
  };

  useEffect(() => {
    if (!heroMode || !isFrontPlaying || !activeIsVideoFile) return;
    const video = frontVideoRef.current;
    if (!video?.muted) return;

    const tryUnmute = () => {
      if (!video.paused && video.muted) {
        video.muted = false;
        setIsMuted(false);
        return true;
      }
      return false;
    };

    tryUnmute();

    const onGesture = () => {
      if (tryUnmute()) {
        window.removeEventListener("pointerdown", onGesture, true);
        window.removeEventListener("keydown", onGesture, true);
      }
    };

    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
  }, [heroMode, isFrontPlaying, activeIsVideoFile, activeSrc]);

  useEffect(() => {
    setUserPaused(false);
    setIsFrontPlaying(false);
  }, [activeIndex, activeSrc]);

  useEffect(() => {
    if (!playableIndexes.length || !activeIsVideoFile || !shouldAutoplayFront) return;
    const t = setTimeout(() => tryPlay.current(true), 120);
    return () => clearTimeout(t);
  }, [activeIndex, activeSrc, activeIsVideoFile, shouldAutoplayFront, playableIndexes.length]);

  useEffect(() => {
    if (!cycleOnEnd || !heroMode || !activeIsVideoFile || !shouldAutoplayFront) return;
    const t = window.setTimeout(() => tryPlay.current(true), 200);
    return () => window.clearTimeout(t);
  }, [activeIndex, heroMode, cycleOnEnd, activeIsVideoFile, activeSrc, shouldAutoplayFront]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting);
        const video = frontVideoRef.current;
        if (!entry.isIntersecting) {
          video?.pause();
          setIsFrontPlaying(false);
          return;
        }
        if (shouldAutoplayFront && activeIsVideoFile && video) {
          tryPlay.current(true);
        }
      },
      { threshold: 0.35, rootMargin: "0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeIsVideoFile, shouldAutoplayFront]);

  useEffect(() => {
    if (!heroMode || activeIsVideoFile) return;
    const video = frontVideoRef.current;
    if (video) video.pause();
  }, [heroMode, activeIsVideoFile, activeIndex]);

  useEffect(() => {
    const handleExclusivePlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      const origin = customEvent.detail?.origin as string | undefined;
      if (origin === "hero-stacked-cards") return;
      setPlaybackLockedByOtherVideo(true);
      setIsFrontPlaying(false);
      setUserPaused(true);
      const video = frontVideoRef.current;
      if (video) video.pause();
    };
    window.addEventListener(VIDEO_EXCLUSIVE_PLAY, handleExclusivePlay);
    return () => window.removeEventListener(VIDEO_EXCLUSIVE_PLAY, handleExclusivePlay);
  }, []);

  useEffect(() => {
    if (!heroMode) return;
    const onRelease = () => {
      setPlaybackLockedByOtherVideo(false);
      if (userPaused || !effectiveAutoplay || !isInView) return;
      if (activeIsVideoFile) tryPlay.current();
    };
    window.addEventListener("video-exclusive-release", onRelease);
    return () => window.removeEventListener("video-exclusive-release", onRelease);
  }, [heroMode, effectiveAutoplay, activeIsVideoFile, isInView, userPaused]);

  const handleItemClick = (index: number) => {
    if (index === activeIndex || isHeroStackPlaceholder(stackItems[index])) return;
    setUserPaused(false);
    setActiveIndex(index);
  };

  const advanceToNext = useCallback(() => {
    if (playableIndexes.length === 0) return;
    setUserPaused(false);
    setActiveIndex((prev) => {
      const currentPos = playableIndexes.indexOf(prev);
      const nextPos = currentPos >= 0 ? (currentPos + 1) % playableIndexes.length : 0;
      return playableIndexes[nextPos];
    });
  }, [playableIndexes]);

  const handleFrontVideoEnded = useCallback(() => {
    if (!cycleOnEnd) return;
    releaseVideoPlayback();
    setIsFrontPlaying(false);
    advanceToNext();
  }, [cycleOnEnd, advanceToNext]);

  const toggleFrontFileVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = frontVideoRef.current;
    if (!video) return;

    if (!video.paused) {
      if (video.muted) {
        video.muted = false;
        setIsMuted(false);
        return;
      }
      setUserPaused(true);
      video.pause();
      setIsFrontPlaying(false);
      releaseVideoPlayback();
      return;
    }

    setUserPaused(false);
    setPlaybackLockedByOtherVideo(false);
    startFrontFileVideo(true);
  };

  useEffect(() => {
    if (!cycleOnEnd || activeIsVideoFile || activeIsYouTube) return;
    const t = window.setTimeout(() => advanceToNext(), 3500);
    return () => window.clearTimeout(t);
  }, [activeIndex, cycleOnEnd, activeIsVideoFile, activeIsYouTube, advanceToNext]);

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
              onClick={!isFirst && !isPlaceholder ? () => handleItemClick(index) : undefined}
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
                  <div
                    className={cn("relative h-full w-full", cycleOnEnd && "cursor-pointer")}
                    onClick={cycleOnEnd ? toggleFrontFileVideo : undefined}
                    role={cycleOnEnd ? "button" : undefined}
                    tabIndex={cycleOnEnd ? 0 : undefined}
                    onKeyDown={
                      cycleOnEnd
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleFrontFileVideo(e as unknown as React.MouseEvent);
                            }
                          }
                        : undefined
                    }
                    aria-label={cycleOnEnd && !isFrontPlaying ? "Play video" : undefined}
                  >
                    <video
                      ref={frontVideoRef}
                      key={activeSrc}
                      data-site-video
                      src={activeSrc}
                      className="pointer-events-none h-full w-full bg-black object-cover"
                      muted={isMuted}
                      autoPlay={shouldAutoplayFront}
                      playsInline
                      loop={heroMode && !cycleOnEnd}
                      preload="auto"
                      onCanPlay={handleCanPlay}
                      onLoadedData={handleLoadedData}
                      onEnded={handleFrontVideoEnded}
                      onPause={() => setIsFrontPlaying(false)}
                      onPlay={() => setIsFrontPlaying(true)}
                      disablePictureInPicture
                      disableRemotePlayback
                    />
                    {cycleOnEnd && !isFrontPlaying ? (
                      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/15">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-black/35 shadow-lg backdrop-blur-sm">
                          <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : activeIsYouTube ? (
                  <HeroYouTubePlayer
                    key={`${activeIndex}-${activeSrc}`}
                    src={activeSrc}
                    activeKey={`${activeIndex}-${activeSrc}`}
                    shouldAutoplay={shouldAutoplayFront}
                    locked={playbackLockedByOtherVideo}
                    cycleOnEnd={cycleOnEnd}
                    onEnded={handleFrontVideoEnded}
                    onPlayingChange={setIsFrontPlaying}
                    onUserPaused={() => setUserPaused(true)}
                    onUserPlay={() => {
                      setUserPaused(false);
                      setPlaybackLockedByOtherVideo(false);
                    }}
                  />
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
