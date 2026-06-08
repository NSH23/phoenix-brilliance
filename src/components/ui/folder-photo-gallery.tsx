import { cn } from "@/lib/utils";
import InteractiveImageBentoGallery, { type BentoGalleryItem } from "@/components/ui/bento-gallery";
import CarouselCard, { type CarouselCardData } from "@/components/ui/carousel-card-1";
import { GalleryPhotoTile, type GalleryPhotoTileItem } from "@/components/ui/gallery-photo-tile";

export type FolderGalleryItem = GalleryPhotoTileItem;

type FolderPhotoGalleryProps = {
  items: FolderGalleryItem[];
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

function toBentoItems(items: FolderGalleryItem[]): BentoGalleryItem[] {
  return items.map((item, i) => ({
    id: item.id ?? `${item.posterSrc}-${i}`,
    title: (item.caption ?? "").trim() || `Photo ${i + 1}`,
    desc: item.isVideo ? "Video" : "",
    url: item.posterSrc,
    isVideo: item.isVideo,
  }));
}

function toCarouselData(items: FolderGalleryItem[]): CarouselCardData[] {
  return items.map((item, i) => ({
    id: item.id ?? `${item.posterSrc}-${i}`,
    imgUrl: item.posterSrc,
    title: (item.caption ?? "").trim() || `Photo ${i + 1}`,
    content: item.isVideo ? "Tap to play video" : "Tap to view full size",
  }));
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function BentoPhotoGrid({
  items,
  onItemClick,
}: {
  items: FolderGalleryItem[];
  onItemClick: (index: number) => void;
}) {
  const count = items.length;

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((item, index) => (
          <GalleryPhotoTile
            key={item.id ?? index}
            item={item}
            index={index}
            ratio={4 / 3}
            onClick={() => onItemClick(index)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        count === 3 && "grid-cols-2 auto-rows-[11rem] sm:auto-rows-[14rem]",
        count === 4 && "grid-cols-2 auto-rows-[10rem] sm:grid-cols-4 sm:auto-rows-[12rem]",
        count === 5 && "grid-cols-2 auto-rows-[10rem] sm:grid-cols-6 sm:auto-rows-[11rem]",
        count === 6 && "grid-cols-2 auto-rows-[10rem] sm:grid-cols-3 sm:auto-rows-[12rem]",
      )}
    >
      {items.map((item, index) => {
        let span = "";
        if (count === 3 && index === 0) span = "col-span-2 row-span-2 sm:col-span-1 sm:row-span-2";
        if (count === 4 && index === 0) span = "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2";
        if (count === 5 && index === 0) span = "col-span-2 row-span-2 sm:col-span-3 sm:row-span-2";
        if (count === 6 && index === 0) span = "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2";

        return (
          <div key={item.id ?? index} className={cn("min-h-0", span)}>
            <GalleryPhotoTile
              item={item}
              index={index}
              ratio={index === 0 ? 4 / 3 : RATIOS[(index + 1) % RATIOS.length]}
              variant={index === 0 ? "wide" : "default"}
              onClick={() => onItemClick(index)}
              className="h-full"
            />
          </div>
        );
      })}
    </div>
  );
}

function MasonryPhotoGrid({
  items,
  onItemClick,
  columns,
}: {
  items: FolderGalleryItem[];
  onItemClick: (index: number) => void;
  columns: 2 | 3;
}) {
  const cols = splitIntoColumns(items, columns);

  return (
    <div className={cn("grid gap-3 sm:gap-4", columns === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3")}>
      {cols.map((column, colIndex) => (
        <div key={`col-${colIndex}`} className="grid gap-3 sm:gap-4">
          {column.map(({ item, index }) => (
            <GalleryPhotoTile
              key={item.id ?? `${colIndex}-${index}`}
              item={item}
              index={index}
              ratio={RATIOS[index % RATIOS.length]}
              onClick={() => onItemClick(index)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FolderPhotoGallery({ items, onItemClick, className }: FolderPhotoGalleryProps) {
  const count = items.length;

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div className={cn("mx-auto max-w-2xl", className)}>
        <GalleryPhotoTile
          item={items[0]}
          index={0}
          ratio={16 / 10}
          variant="wide"
          onClick={() => onItemClick(0)}
        />
      </div>
    );
  }

  if (count <= 6) {
    return (
      <div className={className}>
        <BentoPhotoGrid items={items} onItemClick={onItemClick} />
      </div>
    );
  }

  if (count <= 12) {
    return (
      <div className={cn("space-y-8", className)}>
        <section>
          <SectionLabel>Browse · {count} photos</SectionLabel>
          <CarouselCard
            data={toCarouselData(items)}
            showCarousel={count > 3}
            cardsPerView={Math.min(3, count)}
            onCardClick={onItemClick}
          />
        </section>

        <section>
          <SectionLabel>Gallery</SectionLabel>
          <div className="hidden sm:block">
            <MasonryPhotoGrid items={items} onItemClick={onItemClick} columns={3} />
          </div>
          <div className="sm:hidden">
            <MasonryPhotoGrid items={items} onItemClick={onItemClick} columns={2} />
          </div>
        </section>
      </div>
    );
  }

  const featured = items.slice(0, 4);

  return (
    <div className={cn("space-y-10", className)}>
      <section>
        <SectionLabel>Highlights</SectionLabel>
        <InteractiveImageBentoGallery
          imageItems={toBentoItems(featured)}
          useBuiltInModal={false}
          onItemClick={(_, index) => onItemClick(index)}
          className="py-0"
        />
      </section>

      <section>
        <SectionLabel>Swipe to explore</SectionLabel>
        <CarouselCard
          data={toCarouselData(items)}
          showCarousel
          cardsPerView={3}
          onCardClick={onItemClick}
        />
      </section>

      <section>
        <SectionLabel>Full gallery · {count} items</SectionLabel>
        <div className="hidden sm:block">
          <MasonryPhotoGrid items={items} onItemClick={onItemClick} columns={3} />
        </div>
        <div className="sm:hidden">
          <MasonryPhotoGrid items={items} onItemClick={onItemClick} columns={2} />
        </div>
      </section>
    </div>
  );
}

export default FolderPhotoGallery;
