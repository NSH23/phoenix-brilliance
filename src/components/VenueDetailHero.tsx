import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { VENUES_LIST_PATH } from "@/lib/venueRoutes";
import { PageHeroBackground } from "@/components/ui/page-hero-background";
import { cn } from "@/lib/utils";

export type VenueDetailHeroProps = {
  name: string;
  description: string;
  location: string;
  logoSrc: string;
  bannerSrc: string;
  bannerAlt: string;
  mediaCount: number;
  mapUrl?: string | null;
  badgeLabel?: string;
  backHref?: string;
  backLabel?: string;
  /** When set, replaces the static banner image (e.g. video poster + play). */
  bannerMedia?: React.ReactNode;
  className?: string;
};

export default function VenueDetailHero({
  name,
  description,
  location,
  logoSrc,
  bannerSrc,
  bannerAlt,
  mediaCount,
  mapUrl,
  badgeLabel = "Partner venue",
  backHref = VENUES_LIST_PATH,
  backLabel = "Back to venues",
  bannerMedia,
  className,
}: VenueDetailHeroProps) {
  const mediaLabel = mediaCount === 1 ? "photo or video" : "photos & videos";
  const trimmedDescription = description.trim();
  const trimmedLocation = location.trim();

  return (
    <section className={cn("relative isolate overflow-hidden bg-background pb-8 pt-24 md:pb-10 md:pt-28", className)}>
      <PageHeroBackground intensity="live" />

      <div className="container relative z-10 mx-auto px-4">
        <Link
          to={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto w-full max-w-[400px] lg:mx-0"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <AspectRatio ratio={4 / 3} className="bg-muted">
                {bannerMedia ?? (
                  <OptimizedImage
                    src={bannerSrc}
                    alt={bannerAlt}
                    preset="banner"
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                )}
              </AspectRatio>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-3 py-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background p-1">
                <OptimizedImage
                  src={logoSrc}
                  alt={`${name} logo`}
                  preset="thumb"
                  responsive={false}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="min-w-0 text-sm font-medium leading-snug text-foreground">{name}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="flex min-w-0 flex-col"
          >
            <div className="border-l-[3px] border-primary/75 pl-5 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {badgeLabel}
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-[2.5rem]">
                {name}
              </h1>
              <div
                aria-hidden
                className="mt-4 h-px w-16 bg-primary/40 md:w-20"
              />
            </div>

            {trimmedLocation ? (
              <p className="mt-5 max-w-2xl pl-5 text-sm leading-relaxed text-foreground md:pl-6 md:text-[15px] md:leading-7">
                {trimmedLocation}
              </p>
            ) : null}

            {trimmedDescription ? (
              <p className="mt-4 max-w-2xl pl-5 text-sm leading-relaxed text-muted-foreground md:pl-6 md:text-base md:leading-7">
                {trimmedDescription}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3 pl-5 md:pl-6">
              {mediaCount > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm">
                  <span className="font-semibold tabular-nums text-foreground">{mediaCount}</span>
                  <span className="text-muted-foreground">{mediaLabel}</span>
                </div>
              ) : null}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm">
                <span className="font-semibold text-foreground">5.0</span>
                <span className="text-muted-foreground">Google rating</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 pl-5 sm:flex-row sm:flex-wrap md:pl-6">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-xl px-6 font-semibold shadow-sm hover:shadow-md"
              >
                <Link to="/contact">Book through us</Link>
              </Button>
              {mapUrl ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-xl border-border/60 px-6 font-medium"
                >
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                    View on map
                  </a>
                </Button>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

type VenueBannerVideoProps = {
  posterSrc: string;
  alt: string;
  onPlay: () => void;
};

export function VenueBannerVideoPoster({ posterSrc, alt, onPlay }: VenueBannerVideoProps) {
  return (
    <button
      type="button"
      className="group relative h-full w-full text-left"
      onClick={onPlay}
      aria-label="Play venue video"
    >
      <OptimizedImage
        src={posterSrc}
        alt={alt}
        preset="banner"
        loading="eager"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-sm">
          <Play className="ml-0.5 h-5 w-5 text-foreground" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}

type VenueBannerNativeVideoProps = {
  src: string;
};

export function VenueBannerNativeVideo({ src }: VenueBannerNativeVideoProps) {
  return (
    <video
      src={src}
      className="h-full w-full object-cover"
      controls
      playsInline
      preload="metadata"
    />
  );
}
