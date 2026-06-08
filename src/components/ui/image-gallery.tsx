import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export type MasonryGalleryItem = {
  id?: string | number;
  src: string;
  alt?: string;
  ratio?: number;
  placeholder?: string;
};

type MasonryImageGalleryProps = {
  items: MasonryGalleryItem[];
  onItemClick?: (index: number) => void;
  className?: string;
  columns?: 2 | 3;
};

interface AnimatedImageProps {
  alt: string;
  src: string;
  ratio: number;
  placeholder?: string;
  onClick?: () => void;
  index: number;
}

function AnimatedImage({ alt, src, ratio, placeholder, onClick, index }: AnimatedImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    if (placeholder) setImgSrc(placeholder);
  };

  const content = (
    <AspectRatio ratio={ratio} className="relative size-full overflow-hidden rounded-lg border border-border/60 bg-muted">
      <img
        alt={alt}
        src={imgSrc}
        className={cn(
          "size-full rounded-lg object-cover opacity-0 transition-all duration-700 ease-in-out",
          isInView && !isLoading && "opacity-100",
        )}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
    </AspectRatio>
  );

  return (
    <div
      ref={ref}
      className="transition-transform duration-300 hover:scale-[1.01]"
      style={{ transitionDelay: `${(index % 6) * 30}ms` }}
    >
      {onClick ? (
        <button type="button" onClick={onClick} className="block w-full text-left">
          {content}
        </button>
      ) : (
        content
      )}
    </div>
  );
}

function splitColumns(items: MasonryGalleryItem[], columnCount: number) {
  const columns: Array<Array<{ item: MasonryGalleryItem; index: number }>> = Array.from(
    { length: columnCount },
    () => [],
  );
  items.forEach((item, index) => {
    columns[index % columnCount].push({ item, index });
  });
  return columns;
}

export function MasonryImageGallery({
  items,
  onItemClick,
  className,
  columns = 3,
}: MasonryImageGalleryProps) {
  const cols = splitColumns(items, columns);

  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      <div className={cn("grid gap-4 sm:gap-6", columns === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3")}>
        {cols.slice(0, columns === 2 ? 2 : undefined).map((column, colIndex) => (
          <div key={colIndex} className="grid gap-4 sm:gap-6">
            {column.map(({ item, index }) => {
              const ratio = item.ratio ?? (index % 2 === 0 ? 16 / 9 : 4 / 3);
              return (
                <AnimatedImage
                  key={item.id ?? `${colIndex}-${index}`}
                  alt={item.alt ?? `Gallery image ${index + 1}`}
                  src={item.src}
                  ratio={ratio}
                  placeholder={item.placeholder}
                  onClick={onItemClick ? () => onItemClick(index) : undefined}
                  index={index}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMO_ITEMS: MasonryGalleryItem[] = [
  { id: 1, src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b8?w=800&q=80", alt: "Banquet hall", ratio: 16 / 9 },
  { id: 2, src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80", alt: "Wedding reception", ratio: 4 / 3 },
  { id: 3, src: "https://images.unsplash.com/photo-1478146896989-b14fe3253e89?w=800&q=80", alt: "Event decor", ratio: 3 / 4 },
  { id: 4, src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80", alt: "Table setting", ratio: 16 / 10 },
  { id: 5, src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", alt: "Fine dining", ratio: 16 / 9 },
  { id: 6, src: "https://images.unsplash.com/photo-1530103862672-de8c9debad1d?w=800&q=80", alt: "Celebration", ratio: 1 },
];

export function ImageGallery() {
  return (
    <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center px-4 py-10">
      <MasonryImageGallery items={DEMO_ITEMS} columns={3} />
    </div>
  );
}
