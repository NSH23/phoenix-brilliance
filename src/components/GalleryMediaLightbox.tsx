import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

export default function GalleryMediaLightbox({
  slides,
  activeIndex,
  onActiveIndexChange,
}: GalleryMediaLightboxProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

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
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX > 50) navigate('prev');
    else if (deltaX < -50) navigate('next');
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

  const imageAreaClass = cn(
    'absolute left-0 right-0 flex items-center justify-center px-3 sm:px-12',
    'top-[3.75rem] sm:top-[4.5rem]',
    hasThumbStrip
      ? 'bottom-[calc(7.25rem+env(safe-area-inset-bottom,0px))] md:bottom-[8.5rem] md:-translate-y-[1.25cm]'
      : 'bottom-10 sm:bottom-12',
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {activeIndex !== null && current && slides.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="gallery-media-lightbox"
          onClick={() => onActiveIndexChange(null)}
        >
          <div className="gallery-media-lightbox__scrim" aria-hidden />

          <div className="relative z-10 h-full w-full">
            <div className="gallery-media-lightbox__header absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pb-5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
              <div className="gallery-media-lightbox__counter rounded-full px-3 py-1.5 text-sm">
                <span className="font-medium">{activeIndex + 1}</span>
                <span className="mx-1.5 text-white/50">/</span>
                <span className="text-white/85">{slides.length}</span>
              </div>
              <button
                type="button"
                onClick={() => onActiveIndexChange(null)}
                className="gallery-media-lightbox__control flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground sm:h-12 sm:w-12"
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
              className="gallery-media-lightbox__control absolute left-2 top-[42%] z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground sm:left-6 sm:h-14 sm:w-14 md:flex"
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
              className="gallery-media-lightbox__control absolute right-2 top-[42%] z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground sm:right-6 sm:h-14 sm:w-14 md:flex"
              aria-label="Next"
            >
              <ChevronRight className="h-7 w-7 stroke-[2.5] sm:h-8 sm:w-8" />
            </button>

            <div
              className={imageAreaClass}
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
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  src={optimizeMediaUrl(current.src, { preset: 'lightbox' }) || '/placeholder.svg'}
                  alt={current.caption || 'Photo'}
                  draggable={false}
                  className="max-h-full max-w-full object-contain md:rounded-lg"
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
                  hasThumbStrip
                    ? 'bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[7.5rem]'
                    : 'bottom-6'
                )}
              >
                <p className="text-sm text-white sm:text-lg">{current.caption}</p>
              </div>
            ) : null}

            {hasThumbStrip ? (
              <div className="gallery-media-lightbox__thumb-rail absolute bottom-0 left-0 right-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4 sm:pb-4 sm:pt-3">
                <div
                  ref={thumbStripRef}
                  className="mx-auto flex max-w-4xl justify-start gap-1.5 overflow-x-auto scroll-smooth pb-1 sm:justify-center sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                          'h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border transition-all duration-200 sm:h-16 sm:w-16 sm:rounded-lg',
                          isActive
                            ? 'scale-105 border-primary ring-2 ring-primary/70'
                            : 'border-white/15 opacity-60 hover:opacity-100'
                        )}
                        aria-label={`View item ${idx + 1}`}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        {slide.kind === 'native-video' || slide.kind === 'youtube' ? (
                          <img
                            src={slide.thumbSrc || '/placeholder.svg'}
                            alt=""
                            className="h-full w-full bg-black/30 object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <OptimizedImage
                            src={slide.thumbSrc || slide.src || '/placeholder.svg'}
                            alt=""
                            preset="thumb"
                            responsive={false}
                            className="h-full w-full bg-black/30 object-cover"
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
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-sm text-white transition-colors hover:border-primary/50 hover:bg-primary/20 sm:h-16 sm:w-16 sm:rounded-lg"
                      aria-label={`Show next ${Math.min(THUMB_PAGE_SIZE, thumbWindow.remaining)} thumbnails`}
                    >
                      +{thumbWindow.remaining}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
