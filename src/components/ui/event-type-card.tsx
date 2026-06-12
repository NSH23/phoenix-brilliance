import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

export type EventTypeCardProps = {
  title: string;
  slug: string;
  coverUrl?: string | null;
  albumCount?: number;
  photoCount?: number;
  index?: number;
  className?: string;
};

function formatMeta(albumCount: number, photoCount: number): string {
  const parts: string[] = [];
  if (albumCount > 0) parts.push(`${albumCount} album${albumCount !== 1 ? "s" : ""}`);
  if (photoCount > 0) parts.push(`${photoCount} photo${photoCount !== 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(" · ") : "View gallery";
}

export function EventTypeCard({
  title,
  slug,
  coverUrl,
  albumCount = 0,
  photoCount = 0,
  index = 0,
  className,
}: EventTypeCardProps) {
  const meta = formatMeta(albumCount, photoCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: "easeOut" }}
      className={cn("group h-full", className)}
    >
      <Link
        to={`/events/${slug}`}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300",
          "hover:border-primary/25 hover:shadow-md",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
        aria-label={`View ${title} albums`}
      >
        <AspectRatio ratio={4 / 3} className="w-full bg-muted">
          <div className="absolute inset-0">
            {coverUrl ? (
              <OptimizedImage
                src={coverUrl}
                alt={title}
                preset="card"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted via-muted/80 to-primary/5" />
            )}
          </div>
        </AspectRatio>

        <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
          <h3 className="font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">{meta}</p>
          <span className="mt-auto pt-1 text-xs font-medium text-primary sm:text-sm">View albums</span>
        </div>
      </Link>
    </motion.article>
  );
}

export default EventTypeCard;
