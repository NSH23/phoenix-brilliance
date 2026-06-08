import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export type FolderPhotoItem = {
  id?: string;
  posterSrc: string;
  alt?: string;
  caption?: string;
  isVideo?: boolean;
};

type FolderPhotoMasonryProps = {
  items: FolderPhotoItem[];
  onItemClick: (index: number) => void;
  className?: string;
};

const RATIOS = [16 / 10, 4 / 3, 1, 3 / 4, 16 / 9] as const;

function splitIntoColumns<T>(items: T[], columnCount: number): Array<Array<{ item: T; index: number }>> {
  const columns = Array.from({ length: columnCount }, () => [] as Array<{ item: T; index: number }>);
  items.forEach((item, index) => {
    columns[index % columnCount].push({ item, index });
  });
  return columns;
}

type MasonryTileProps = {
  item: FolderPhotoItem;
  index: number;
  ratio: number;
  onClick: () => void;
};

function MasonryPhotoTile({ item, index, ratio, onClick }: MasonryTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ delay: (index % 6) * 0.04, duration: 0.45, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition-shadow duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={item.alt ?? item.caption ?? "Open gallery item"}
      >
        <AspectRatio ratio={ratio} className="bg-muted">
          <img
            src={item.posterSrc}
            alt={item.alt ?? item.caption ?? "Gallery photo"}
            className={cn(
              "h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105",
              isInView && !isLoading ? "opacity-100" : "opacity-0",
            )}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoading(false)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          {item.isVideo ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-10 w-10 text-white drop-shadow-md" fill="currentColor" />
            </div>
          ) : null}
          {(item.caption ?? "").trim() ? (
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="line-clamp-2 text-xs font-medium text-white sm:text-sm">{item.caption}</p>
            </div>
          ) : null}
        </AspectRatio>
      </button>
    </motion.div>
  );
}

export function FolderPhotoMasonry({ items, onItemClick, className }: FolderPhotoMasonryProps) {
  if (items.length === 0) return null;

  const useBentoStrip = items.length <= 6;

  if (useBentoStrip) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
        {items.map((item, index) => (
          <MasonryPhotoTile
            key={item.id ?? `${item.posterSrc}-${index}`}
            item={item}
            index={index}
            ratio={RATIOS[index % RATIOS.length]}
            onClick={() => onItemClick(index)}
          />
        ))}
      </div>
    );
  }

  const mobileColumns = splitIntoColumns(items, 2);
  const desktopColumns = splitIntoColumns(items, 3);

  return (
    <div className={cn("w-full", className)}>
      <div className="grid gap-3 sm:hidden" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {mobileColumns.map((column, colIndex) => (
          <div key={`m-col-${colIndex}`} className="grid gap-3">
            {column.map(({ item, index }) => (
              <MasonryPhotoTile
                key={item.id ?? `${item.posterSrc}-${index}`}
                item={item}
                index={index}
                ratio={RATIOS[index % RATIOS.length]}
                onClick={() => onItemClick(index)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {desktopColumns.map((column, colIndex) => (
          <div key={`d-col-${colIndex}`} className="grid gap-4">
            {column.map(({ item, index }) => (
              <MasonryPhotoTile
                key={item.id ?? `${item.posterSrc}-${index}`}
                item={item}
                index={index}
                ratio={RATIOS[index % RATIOS.length]}
                onClick={() => onItemClick(index)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FolderPhotoMasonry;
