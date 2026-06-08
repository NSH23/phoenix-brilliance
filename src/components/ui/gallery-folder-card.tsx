import { motion } from "framer-motion";
import { FolderOpen, Images } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card-2";

export type GalleryFolderCardProps = {
  name: string;
  itemCount: number;
  coverUrl?: string | null;
  description?: string;
  onClick?: () => void;
  href?: string;
  delay?: number;
  className?: string;
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
}: GalleryFolderCardProps) {
  const countLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const subtitle = description?.trim() || "Open album";

  const cardInner = (
    <Card className="flex h-full flex-col border-border/60 transition-shadow duration-300 group-hover:shadow-lg">
      <CardContent className="relative flex-1">
        <AspectRatio ratio={4 / 3} className="bg-muted">
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 transition-opacity duration-300 sm:opacity-70 sm:group-hover:opacity-100" />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/80">
              <FolderOpen className="h-9 w-9 text-muted-foreground/45 sm:h-10 sm:w-10" />
              <span className="text-xs text-muted-foreground">No cover yet</span>
            </div>
          )}

          {coverUrl ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <div className="translate-y-0 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                <p className="line-clamp-1 text-sm font-bold text-white drop-shadow-sm">{name}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/80">{subtitle}</p>
              </div>
            </div>
          ) : null}
        </AspectRatio>
      </CardContent>

      <CardFooter className="flex-col items-start gap-1 border-t border-border/40 bg-card/95 p-3 sm:p-4">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1 font-serif text-base sm:text-lg">{name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-1">{subtitle}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Images className="h-3 w-3" />
            {itemCount}
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{countLabel}</p>
      </CardFooter>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      {href ? (
        <Link to={href} className="group block h-full w-full text-left">
          {cardInner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="group h-full w-full text-left">
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
  }>;
  className?: string;
};

export function GalleryFolderGrid({ folders, className }: GalleryFolderGridProps) {
  if (folders.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        folders.length === 1 && "mx-auto max-w-sm grid-cols-1",
        folders.length >= 2 && "grid-cols-2",
        folders.length >= 3 && "sm:grid-cols-3",
        folders.length >= 5 && "lg:grid-cols-4",
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
          delay={index * 0.04}
        />
      ))}
    </div>
  );
}

export default GalleryFolderCard;
