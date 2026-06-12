import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { CarouselApi } from "@/components/ui/carousel";
import { Stories, StoriesContent, Story, StoryOverlay } from "@/components/ui/stories-carousel";
import { cn } from "@/lib/utils";
import { getYouTubeThumbnail, isYouTubeValue } from "@/lib/youtube";
import {
  REELS_EXCLUSIVE_EVENT,
  VIDEO_EXCLUSIVE_PLAY,
  claimVideoPlayback,
  pauseAllSiteVideosExcept,
  releaseVideoPlayback,
} from "@/lib/videoPlaybackCoordinator";

type ReelItem = { src: string; alt: string };

function isVideoSrc(src: string) {
  return (
    isYouTubeValue(src) ||
    /\.(mp4|webm|mov)(\?|$)/i.test(src) ||
    src.includes("/video") ||
    src.includes("content-media")
  );
}

function MobileReelMedia({
  reel,
  index,
  isActive,
}: {
  reel: ReelItem;
  index: number;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const slideId = `mobile-reel-${index}-${reel.src}`;
  const isVideo = isVideoSrc(reel.src);
  const isYouTube = isYouTubeValue(reel.src);

  useEffect(() => {
    if (isActive) return;
    videoRef.current?.pause();
    setIsPlaying(false);
  }, [isActive]);

  useEffect(() => {
    const onExclusive = (e: Event) => {
      const origin = (e as CustomEvent).detail?.origin as string | undefined;
      if (origin === "mobile-reels") return;
      videoRef.current?.pause();
      setIsPlaying(false);
    };
    const onReelsEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { exceptSlideId?: string; slideId?: string };
      if (detail?.exceptSlideId === slideId || detail?.slideId === slideId) return;
      videoRef.current?.pause();
      setIsPlaying(false);
    };
    window.addEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive);
    window.addEventListener(REELS_EXCLUSIVE_EVENT, onReelsEvent);
    return () => {
      window.removeEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive);
      window.removeEventListener(REELS_EXCLUSIVE_EVENT, onReelsEvent);
    };
  }, [slideId]);

  const beginPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    claimVideoPlayback("mobile-reels", { slideId });
    pauseAllSiteVideosExcept(video);
    video.muted = false;
    video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        video.muted = true;
        video.play().then(() => setIsPlaying(true)).catch(() => releaseVideoPlayback());
      });
  }, [slideId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVideo || isYouTube) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      beginPlayback();
    } else {
      video.pause();
      setIsPlaying(false);
      releaseVideoPlayback();
    }
  };

  if (!isVideo) {
    return (
      <img
        src={reel.src}
        alt={reel.alt}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
        data-protected-media=""
        onContextMenu={(e) => e.preventDefault()}
      />
    );
  }

  if (isYouTube) {
    return (
      <a
        href={reel.src}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 block"
        aria-label={`Watch ${reel.alt}`}
      >
        <img
          src={getYouTubeThumbnail(reel.src)}
          alt={reel.alt}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
          data-protected-media=""
          onContextMenu={(e) => e.preventDefault()}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/40 bg-black/35 backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
          </div>
        </div>
      </a>
    );
  }

  return (
    <button
      type="button"
      className="absolute inset-0 block w-full border-0 bg-transparent p-0"
      onClick={handleToggle}
      aria-label={isPlaying ? `Pause ${reel.alt}` : `Play ${reel.alt}`}
    >
      <video
        ref={videoRef}
        data-site-video
        src={reel.src}
        className="size-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        onEnded={() => {
          setIsPlaying(false);
          releaseVideoPlayback();
        }}
      />
      {!isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/35 bg-black/30 backdrop-blur-sm shadow-lg">
            <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
          </div>
        </div>
      ) : null}
    </button>
  );
}

export function MobileReelsCarousel({ reels }: { reels: ReelItem[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (reels.length === 0) return null;

  return (
    <div className="w-full pb-2 md:hidden">
      <Stories
        setApi={setApi}
        opts={{
          align: "center",
          loop: reels.length > 1,
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        className="px-0"
      >
        <StoriesContent className="-ml-2 gap-3 px-2">
          {reels.map((reel, index) => (
            <Story
              key={`${index}-${reel.src}`}
              itemClassName="!w-[min(78vw,280px)] basis-auto pl-3"
              className={cn(
                "aspect-[3/4] w-[min(78vw,280px)] rounded-2xl border border-border/50 shadow-[0_12px_32px_rgba(0,0,0,0.14)]",
                "transition-transform duration-300",
                activeIndex === index ? "scale-100" : "scale-[0.94] opacity-90",
              )}
            >
              <MobileReelMedia reel={reel} index={index} isActive={activeIndex === index} />
              <StoryOverlay />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-3 pb-3 pt-8">
                <p className="truncate text-xs font-medium text-white/95">{reel.alt}</p>
              </div>
            </Story>
          ))}
        </StoriesContent>
      </Stories>

      {reels.length > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5 px-4">
          {reels.map((reel, i) => (
            <button
              key={`dot-${reel.src}-${i}`}
              type="button"
              aria-label={`Go to reel ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
              )}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
