import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OptimizedImage } from "@/components/ui/optimized-image";

export type GalleryFolderCardProps = {
  name: string;
  itemCount: number;
  coverUrl?: string | null;
  description?: string;
  onClick?: () => void;
  href?: string;
  delay?: number;
  className?: string;
  variant?: "default" | "featured";
  featured?: boolean;
};

export function GalleryFolderCard({
  name,
  itemCount,
  coverUrl,
  description,
  onClick,
  href,
  delay = 0,
  className,
  variant = "default",
  featured = false,
}: GalleryFolderCardProps) {
  const countLabel = itemCount === 1 ? "1 photo" : `${itemCount} photos`;
  const subtitle = description?.trim();
  const isFeatured = variant === "featured";

  const cardInner = isFeatured ? (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card",
        "shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300",
        "group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]",
        "dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
      )}
    >
      <AspectRatio ratio={4 / 5} className="bg-muted/50">
        {coverUrl ? (
          <>
            <OptimizedImage
              src={coverUrl}
              alt={name}
              preset="card"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
              aria-hidden
            />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-muted to-primary/5" />
        )}

        {featured ? (
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Featured
          </span>
        ) : null}

        <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {countLabel}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-white drop-shadow-sm sm:text-xl">
            {name}
          </p>
          {subtitle ? (
            <p className="mt-1 line-clamp-1 text-xs text-white/75 sm:text-sm">{subtitle}</p>
          ) : (
            <p className="mt-1 text-xs text-white/75 sm:text-sm">{countLabel}</p>
          )}
        </div>
      </AspectRatio>
    </div>
  ) : (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card",
        "transition-colors duration-200",
        "group-hover:border-border group-hover:bg-muted/20",
      )}
    >
      <div className="relative">
        <AspectRatio ratio={1} className="bg-muted/50">
          {coverUrl ? (
            <OptimizedImage
              src={coverUrl}
              alt={name}
              preset="card"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full bg-muted/40" />
          )}
          <span className="absolute bottom-2 right-2 rounded-md border border-border/50 bg-background/95 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {countLabel}
          </span>
        </AspectRatio>
      </div>

      <div className="flex min-h-[3rem] flex-col justify-center border-t border-border/40 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground sm:text-sm">
          {name}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
          {subtitle || countLabel}
        </p>
      </div>
    </div>
  );

  const wrapperClass = cn("group block h-full w-full text-left", className);

  return (
    <motion.div
      initial={{ opacity: 0, y: isFeatured ? 16 : 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ delay, duration: isFeatured ? 0.4 : 0.3, ease: "easeOut" }}
      className="h-full"
    >
      {href ? (
        <Link to={href} className={wrapperClass}>
          {cardInner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={wrapperClass}>
          {cardInner}
        </button>
      )}
    </motion.div>
  );
}

type GalleryFolderGridProps = {
  folders: Array<{
    id: string;
    name: string;
    count: number;
    coverUrl?: string | null;
    description?: string;
    href?: string;
    onClick?: () => void;
    featured?: boolean;
  }>;
  className?: string;
  compact?: boolean;
  variant?: "default" | "featured";
};

export function GalleryFolderGrid({
  folders,
  className,
  compact = true,
  variant = "default",
}: GalleryFolderGridProps) {
  if (folders.length === 0) return null;

  const isFeatured = variant === "featured";

  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-2.5",
        isFeatured
          ? cn(
              folders.length === 1 && "mx-auto max-w-sm grid-cols-1",
              folders.length >= 2 && "grid-cols-2 lg:grid-cols-3",
              folders.length >= 4 && "xl:grid-cols-4",
            )
          : compact
            ? cn(
                folders.length === 1 && "mx-auto max-w-[11rem] grid-cols-1",
                folders.length >= 2 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
                folders.length >= 6 && "md:grid-cols-4 xl:grid-cols-5",
              )
            : cn(
                folders.length === 1 && "mx-auto max-w-xs grid-cols-1",
                folders.length >= 2 && "grid-cols-2 sm:grid-cols-3",
                folders.length >= 5 && "lg:grid-cols-4",
              ),
        className,
      )}
    >
      {folders.map((folder, index) => (
        <GalleryFolderCard
          key={folder.id}
          name={folder.name}
          itemCount={folder.count}
          coverUrl={folder.coverUrl}
          description={folder.description}
          href={folder.href}
          onClick={folder.onClick}
          delay={index * 0.05}
          variant={variant}
          featured={folder.featured}
        />
      ))}
    </div>
  );
}

export default GalleryFolderCard;
