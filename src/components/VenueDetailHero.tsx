import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, ExternalLink, Building2, Camera, Play } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";

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
  /** When set, replaces the static banner image (e.g. video poster + play). */
  bannerMedia?: React.ReactNode;
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
  badgeLabel = "Partner Venue",
  bannerMedia,
}: VenueDetailHeroProps) {
  return (
    <section className="relative pb-12">
      <div className="container mx-auto px-4">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative space-y-3"
          >
            <AspectRatio ratio={16 / 10} className="overflow-hidden rounded-2xl bg-muted shadow-sm">
              {bannerMedia ?? (
                <OptimizedImage
                  src={bannerSrc}
                  alt={bannerAlt}
                  preset="banner"
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 hidden max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-background/90 px-4 py-2 backdrop-blur-sm lg:flex">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium">{location}</span>
              </div>
            </AspectRatio>

            <div className="flex items-start gap-2 rounded-xl bg-muted/80 px-4 py-3 text-sm lg:hidden">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium leading-snug">{location}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-muted/25 p-1.5 sm:h-16 sm:w-16">
                <OptimizedImage
                  src={logoSrc}
                  alt={`${name} logo`}
                  preset="thumb"
                  responsive={false}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <Badge variant="outline" className="mb-1.5 text-primary">
                  {badgeLabel}
                </Badge>
                <h1 className="font-serif text-3xl font-semibold md:text-4xl">{name}</h1>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
                <Camera className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold">{mediaCount}</div>
                <div className="text-sm text-muted-foreground">Photos & videos</div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
                <Building2 className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold">5★</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/contact">
                <Button size="lg" className="rounded-full px-8">
                  <Phone className="mr-2 h-4 w-4" />
                  Book Through Us
                </Button>
              </Link>
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg" className="rounded-full px-8">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Map
                  </Button>
                </a>
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
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
        <Play className="h-14 w-14 text-white drop-shadow-lg sm:h-16 sm:w-16" fill="currentColor" />
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
