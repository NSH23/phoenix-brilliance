import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { optimizeMediaUrl } from '@/lib/mediaDelivery';
import { getYouTubeNocookieEmbedUrl } from '@/lib/youtube';
import { cn } from '@/lib/utils';

export type GalleryLightboxSlide = {
  id: string;
  caption?: string | null;
  kind: 'image' | 'native-video' | 'youtube';
  src: string;
  thumbSrc?: string;
};

type GalleryMediaLightboxProps = {
  slides: GalleryLightboxSlide[];
  activeIndex: number | null;
  onActiveIndexChange: (index: number | null) => void;
};

const THUMB_PAGE_SIZE = 10;

function getThumbWindow(activeIndex: number, total: number) {
  const page = Math.floor(activeIndex / THUMB_PAGE_SIZE);
  const start = page * THUMB_PAGE_SIZE;
  const end = Math.min(start + THUMB_PAGE_SIZE, total);
  return { start, end, remaining: total - end };
}

const controlButtonClass = cn(
  'flex items-center justify-center rounded-full border border-ivory/30 bg-black/45 text-ivory shadow-lg backdrop-blur-md',
  'transition-all duration-300 hover:border-primary/60 hover:bg-primary/90 hover:text-primary-foreground'
);

export default function GalleryMediaLightbox({
  slides,
  activeIndex,
  onActiveIndexChange,
}: GalleryMediaLightboxProps) {
  const touchStartX = useRef(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (activeIndex === null || slides.length === 0) return;
      if (direction === 'prev') {
        onActiveIndexChange(activeIndex === 0 ? slides.length - 1 : activeIndex - 1);
      } else {
        onActiveIndexChange(activeIndex === slides.length - 1 ? 0 : activeIndex + 1);
      }
    },
    [activeIndex, onActiveIndexChange, slides.length]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'Escape') onActiveIndexChange(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, navigate, onActiveIndexChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) navigate('prev');
    else if (delta < -50) navigate('next');
  };

  const current = activeIndex !== null ? slides[activeIndex] : null;
  const hasThumbStrip = slides.length > 1;
  const thumbWindow =
    activeIndex !== null ? getThumbWindow(activeIndex, slides.length) : { start: 0, end: 0, remaining: 0 };
  const visibleThumbs = slides.slice(thumbWindow.start, thumbWindow.end);

  useEffect(() => {
    if (activeIndex === null) return;
    activeThumbRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIndex, thumbWindow.start]);

  return (
    <AnimatePresence>
      {activeIndex !== null && current && slides.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-charcoal/98 backdrop-blur-xl"
          onClick={() => onActiveIndexChange(null)}
        >
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
            <div className="rounded-full border border-ivory/20 bg-black/35 px-3 py-1.5 text-sm text-ivory shadow-md backdrop-blur-md">
              <span className="font-medium text-ivory">{activeIndex + 1}</span>
              <span className="mx-1.5 text-ivory/50">/</span>
              <span className="text-ivory/80">{slides.length}</span>
            </div>
            <button
              type="button"
              onClick={() => onActiveIndexChange(null)}
              className={cn(controlButtonClass, 'h-11 w-11 sm:h-12 sm:w-12')}
              aria-label="Close"
            >
              <X className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('prev');
            }}
            className={cn(
              controlButtonClass,
              'absolute left-2 top-[42%] z-30 h-12 w-12 -translate-y-1/2 sm:left-6 sm:h-14 sm:w-14'
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7 stroke-[2.5] sm:h-8 sm:w-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('next');
            }}
            className={cn(
              controlButtonClass,
              'absolute right-2 top-[42%] z-30 h-12 w-12 -translate-y-1/2 sm:right-6 sm:h-14 sm:w-14'
            )}
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7 stroke-[2.5] sm:h-8 sm:w-8" />
          </button>

          <div
            className={cn(
              'absolute left-0 right-0 top-16 flex items-center justify-center px-4 sm:top-[4.5rem] sm:px-12',
              hasThumbStrip
                ? 'bottom-[7.5rem] sm:bottom-[8.5rem] -translate-y-[0.85cm] sm:-translate-y-[1.25cm]'
                : 'bottom-10 sm:bottom-12'
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {current.kind === 'youtube' ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="aspect-video w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <iframe
                  src={getYouTubeNocookieEmbedUrl(current.src, { autoplay: true })}
                  title={current.caption || 'YouTube video'}
                  className="h-full w-full rounded-lg border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </motion.div>
            ) : current.kind === 'native-video' ? (
              <motion.video
                key={current.src}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={current.src}
                className="max-h-full max-w-full rounded-lg object-contain"
                controls
                playsInline
                preload="metadata"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                key={current.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={optimizeMediaUrl(current.src, { preset: 'lightbox' }) || '/placeholder.svg'}
                alt={current.caption || 'Photo'}
                draggable={false}
                className="max-h-full max-w-full rounded-lg object-contain"
                loading="eager"
                decoding="async"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            )}
          </div>

          {current.caption?.trim() ? (
            <div
              className={cn(
                'absolute left-0 right-0 z-20 px-4 text-center',
                hasThumbStrip ? 'bottom-[6.75rem] sm:bottom-[7.5rem]' : 'bottom-6'
              )}
            >
              <p className="text-base text-ivory sm:text-lg">{current.caption}</p>
            </div>
          ) : null}

          {hasThumbStrip ? (
            <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-ivory/10 bg-gradient-to-t from-charcoal via-charcoal/95 to-charcoal/80 px-4 pb-4 pt-3">
              <div
                ref={thumbStripRef}
                className="mx-auto flex max-w-4xl justify-center gap-2 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {visibleThumbs.map((slide, localIdx) => {
                  const idx = thumbWindow.start + localIdx;
                  const isActive = idx === activeIndex;
                  return (
                  <button
                    key={slide.id}
                    ref={isActive ? activeThumbRef : undefined}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActiveIndexChange(idx);
                    }}
                    className={cn(
                      'h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200 sm:h-16 sm:w-16',
                      isActive
                        ? 'scale-105 border-primary ring-2 ring-primary/70'
                        : 'border-ivory/15 opacity-60 hover:opacity-100'
                    )}
                    aria-label={`View item ${idx + 1}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {slide.kind === 'native-video' || slide.kind === 'youtube' ? (
                      <img
                        src={slide.thumbSrc || '/placeholder.svg'}
                        alt=""
                        className="h-full w-full bg-muted/30 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <OptimizedImage
                        src={slide.thumbSrc || slide.src || '/placeholder.svg'}
                        alt=""
                        preset="thumb"
                        responsive={false}
                        className="h-full w-full bg-muted/30 object-contain p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    )}
                  </button>
                  );
                })}
                {thumbWindow.remaining > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActiveIndexChange(thumbWindow.end);
                    }}
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-ivory/15 bg-ivory/10 text-sm text-ivory transition-colors hover:border-primary/50 hover:bg-primary/20 sm:h-16 sm:w-16"
                    aria-label={`Show next ${Math.min(THUMB_PAGE_SIZE, thumbWindow.remaining)} thumbnails`}
                  >
                    +{thumbWindow.remaining}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
