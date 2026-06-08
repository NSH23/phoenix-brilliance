import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SRCSET_SIZES } from "@/lib/mediaDelivery";

export type GalleryPhotoTileItem = {
  id?: string;
  posterSrc: string;
  alt?: string;
  caption?: string;
  isVideo?: boolean;
};

type GalleryPhotoTileProps = {
  item: GalleryPhotoTileItem;
  index: number;
  onClick: () => void;
  ratio?: number;
  variant?: "default" | "hero" | "wide";
  className?: string;
};

const VARIANT_RATIO: Record<NonNullable<GalleryPhotoTileProps["variant"]>, number> = {
  default: 4 / 3,
  hero: 3 / 4,
  wide: 16 / 9,
};

export function GalleryPhotoTile({
  item,
  index,
  onClick,
  ratio,
  variant = "default",
  className,
}: GalleryPhotoTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-32px" });
  const [loaded, setLoaded] = useState(false);
  const resolvedRatio = ratio ?? VARIANT_RATIO[variant];
  const caption = (item.caption ?? "").trim();
  const label = caption || item.alt || "Gallery photo";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: (index % 8) * 0.04, duration: 0.5, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <button
        type="button"
        onClick={onClick}
        className="group relative h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={label}
      >
        <AspectRatio ratio={resolvedRatio} className="bg-muted">
          <OptimizedImage
            src={item.posterSrc}
            alt={label}
            preset="card"
            sizes={SRCSET_SIZES.gallery}
            className={cn(
              "h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105",
              isInView && loaded ? "opacity-100" : "opacity-0",
            )}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />

          {/* Base gradient — always visible on mobile, hover on desktop */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100" />

          {/* Carousel-card style slide-up panel on hover */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="bg-black/75 p-3 sm:p-4 backdrop-blur-[2px]">
              <p className="line-clamp-2 text-sm font-semibold text-white">{label}</p>
              {item.isVideo ? (
                <p className="mt-0.5 text-xs uppercase tracking-wider text-white/70">Video</p>
              ) : null}
            </div>
          </div>

          {item.isVideo ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 text-white" fill="currentColor" />
              </div>
            </div>
          ) : null}
        </AspectRatio>
      </button>
    </motion.div>
  );
}
