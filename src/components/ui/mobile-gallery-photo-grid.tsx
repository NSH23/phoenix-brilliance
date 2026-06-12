import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SRCSET_SIZES } from "@/lib/mediaDelivery";
import type { GalleryPhotoTileItem } from "@/components/ui/gallery-photo-tile";

type MobileGalleryPhotoGridProps = {
  items: GalleryPhotoTileItem[];
  onItemClick: (index: number) => void;
  className?: string;
};

function MobilePhotoTile({
  item,
  index,
  onClick,
}: {
  item: GalleryPhotoTileItem;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-16px" });
  const [loaded, setLoaded] = useState(false);
  const label = (item.caption ?? item.alt ?? "Gallery photo").trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ delay: (index % 18) * 0.01, duration: 0.25 }}
      className="aspect-square min-w-0"
    >
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="relative h-full w-full overflow-hidden bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-label={label}
      >
        <OptimizedImage
          src={item.posterSrc}
          alt={label}
          preset="card"
          sizes={SRCSET_SIZES.gallery}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            isInView && loaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        {item.isVideo ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50">
              <Play className="h-3.5 w-3.5 text-white" fill="currentColor" />
            </div>
          </div>
        ) : null}
      </button>
    </motion.div>
  );
}

/** Phone gallery app-style photo grid — 3 columns, tight gaps, edge-to-edge feel. */
export function MobileGalleryPhotoGrid({ items, onItemClick, className }: MobileGalleryPhotoGridProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-0.5",
        items.length === 1 && "mx-auto max-w-[33%] grid-cols-1",
        items.length === 2 && "grid-cols-2",
        className,
      )}
    >
      {items.map((item, index) => (
        <MobilePhotoTile
          key={item.id ?? index}
          item={item}
          index={index}
          onClick={() => onItemClick(index)}
        />
      ))}
    </div>
  );
}

export default MobileGalleryPhotoGrid;
