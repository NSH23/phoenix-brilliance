import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { HomeSectionSplitTitle } from "@/components/ui/home-section-split-title";
import { HomeSectionHeader } from "@/components/ui/home-section-header";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { publicEventGalleryListingPath, isPublicGalleryHubEnabled } from "@/lib/publicGallery";
import { cn } from "@/lib/utils";

export type AlbumDetailHeroProps = {
  albumTitle: string;
  albumDescription?: string | null;
  coverSrc: string;
  eventTitle?: string;
  eventSlug?: string;
  eventDate?: string | null;
  photoCount: number;
  videoCount: number;
  className?: string;
};

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AlbumDetailHero({
  albumTitle,
  albumDescription,
  coverSrc,
  eventTitle,
  eventSlug,
  eventDate,
  photoCount,
  videoCount,
  className,
}: AlbumDetailHeroProps) {
  const eventListingPath = eventSlug ? publicEventGalleryListingPath(eventSlug) : "/events";
  const hubEnabled = isPublicGalleryHubEnabled();
  const description = albumDescription?.trim();

  return (
    <section className={cn("relative overflow-hidden bg-background pb-6 pt-24 md:pb-8 md:pt-28", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_10%_0%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,hsl(var(--primary)/0.08),transparent_50%)] dark:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden opacity-[0.12] dark:block"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="container relative mx-auto px-4">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link
            to={hubEnabled ? "/gallery" : "/events"}
            className="transition-colors hover:text-primary"
          >
            {hubEnabled ? "Gallery" : "Events"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
          {eventTitle && eventSlug ? (
            <>
              <Link to={eventListingPath} className="transition-colors hover:text-primary">
                {eventTitle}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            </>
          ) : null}
          <span className="font-medium text-foreground">{albumTitle}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="min-w-0"
          >
            <HomeSectionHeader
              badge={eventTitle || "Album"}
              title={<HomeSectionSplitTitle line1={albumTitle} accent="Gallery" />}
              subtitle={description || undefined}
              headingLevel="h1"
            />

            <div className="mt-6 flex flex-wrap gap-3 pl-5 md:pl-6">
              {eventDate ? (
                <div className="inline-flex items-center rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm text-foreground">
                  {formatEventDate(eventDate)}
                </div>
              ) : null}
              {photoCount > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm">
                  <span className="font-semibold tabular-nums text-foreground">{photoCount}</span>
                  <span className="text-muted-foreground">{photoCount === 1 ? "photo" : "photos"}</span>
                </div>
              ) : null}
              {videoCount > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm">
                  <span className="font-semibold tabular-nums text-foreground">{videoCount}</span>
                  <span className="text-muted-foreground">{videoCount === 1 ? "video" : "videos"}</span>
                </div>
              ) : null}
            </div>

            {eventSlug ? (
              <Link
                to={eventListingPath}
                className="mt-6 inline-flex items-center gap-2 pl-5 text-sm text-muted-foreground transition-colors hover:text-primary md:pl-6"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to {eventTitle ?? "event"} albums
              </Link>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <AspectRatio ratio={4 / 3} className="bg-muted">
                <OptimizedImage
                  src={coverSrc}
                  alt={albumTitle}
                  preset="banner"
                  loading="eager"
                  className="h-full w-full object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
                  aria-hidden
                />
              </AspectRatio>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
