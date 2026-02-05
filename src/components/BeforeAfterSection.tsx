import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, GripHorizontal, RotateCcw } from "lucide-react";
import { getActiveBeforeAfter, BeforeAfter } from "@/services/beforeAfter";
import { cn } from "@/lib/utils";

function ImageCompareSlider({
  beforeSrc,
  afterSrc,
  alt,
}: {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handlePointerLeave = () => {
    if (isDragging) setIsDragging(false);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(50);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-muted select-none touch-none cursor-ew-resize group"
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('[data-slider-handle]')) {
          updatePosition(e.clientX);
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      {/* After image (full, base layer) */}
      <img
        src={afterSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/placeholder.svg";
        }}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>

      {/* Slider line & handle */}
      <div
        data-slider-handle
        className={cn(
          "absolute top-0 bottom-0 w-12 -ml-6 cursor-ew-resize z-10 flex justify-center",
          "transition-shadow"
        )}
        style={{ left: `${position}%` }}
        onPointerDown={handlePointerDown}
      >
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 bg-white left-1/2 -translate-x-1/2",
            isDragging && "shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          )}
        />
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center",
            "transition-transform",
            isDragging && "scale-110 shadow-xl"
          )}
        >
          <GripHorizontal className="w-4 h-4 text-charcoal/80 rotate-90" strokeWidth={2.5} />
        </div>
      </div>
      {/* Reset button */}
      <button
        type="button"
        onClick={handleReset}
        className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-charcoal/90 shadow-md flex items-center justify-center
                   opacity-80 hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-charcoal
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Reset comparison"
        title="Reset"
      >
        <RotateCcw className="w-3.5 h-3.5 text-foreground" />
      </button>
    </div>
  );
}

export default function BeforeAfterSection() {
  const [items, setItems] = useState<BeforeAfter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getActiveBeforeAfter()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  const displayItems = items.slice(0, 4);

  return (
    <section id="before-after" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-14"
        >
          <h2 className="section-title mb-4 text-2xl sm:text-3xl md:text-4xl">
            <span className="text-gradient-gold">Transformations</span>
          </h2>
          <p className="section-subtitle max-w-xl mx-auto text-base sm:text-lg">
            See how we transform spaces into dream venues.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-white dark:bg-white/95 rounded-[24px] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.3)] transition-shadow"
            >
              {/* Event Type Badge */}
              <span className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-primary/15 dark:bg-primary/20 border border-primary/30 text-primary mb-4">
                {item.title}
              </span>

              <ImageCompareSlider
                beforeSrc={item.before_image_url}
                afterSrc={item.after_image_url}
                alt={item.title}
              />

              {item.description && (
                <p className="mt-4 text-base text-gray-700 leading-relaxed">
                  {item.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
