import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card-2";
import { OptimizedImage } from "@/components/ui/optimized-image";

type EventCategoryCardProps = {
  title: string;
  slug: string;
  coverUrl?: string | null;
  className?: string;
};

export function EventCategoryCard({ title, slug, coverUrl, className }: EventCategoryCardProps) {
  return (
    <Link
      to={`/events/${slug}`}
      className={cn("group block h-full w-[230px] shrink-0 snap-start touch-manipulation sm:w-[260px]", className)}
    >
      <Card className="flex h-full flex-col overflow-hidden border-border/60 bg-card/95 backdrop-blur-sm">
        <CardContent className="relative p-0">
          <AspectRatio ratio={3 / 4} className="bg-muted">
            {coverUrl ? (
              <>
                <OptimizedImage
                  src={coverUrl}
                  alt={title}
                  preset="card"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />
              </>
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/15 via-muted to-primary/5" />
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 text-center">
              <p className="font-serif text-lg font-semibold tracking-wide text-white drop-shadow-sm">{title}</p>
            </div>
          </AspectRatio>
        </CardContent>
      </Card>
    </Link>
  );
}

export default EventCategoryCard;
