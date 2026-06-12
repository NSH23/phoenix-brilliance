import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { venueDetailPath } from "@/lib/venueRoutes";
import { cn } from "@/lib/utils";

export type PartnerVenueCardData = {
  id: string;
  name: string;
  location: string;
  logoUrl: string;
  bannerUrl?: string | null;
};

type PartnerVenueCardProps = {
  venue: PartnerVenueCardData;
  index?: number;
  className?: string;
};

export function PartnerVenueCard({ venue, index = 0, className }: PartnerVenueCardProps) {
  const cover = venue.bannerUrl || null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: "easeOut" }}
      className={cn("group h-full", className)}
    >
      <Link
        to={venueDetailPath(venue.id)}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300",
          "hover:border-primary/25 hover:shadow-md",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
        aria-label={`View ${venue.name}`}
      >
        <AspectRatio ratio={4 / 3} className="w-full bg-muted">
          <div className="absolute inset-0">
            {cover ? (
              <OptimizedImage
                src={cover}
                alt=""
                aria-hidden
                preset="banner"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted via-muted/80 to-primary/5" />
            )}
            <div className="absolute bottom-3.5 left-3.5 flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 bg-white/95 p-1 shadow-sm dark:bg-card/95">
              <OptimizedImage
                src={venue.logoUrl}
                alt=""
                preset="thumb"
                responsive={false}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </AspectRatio>

        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          <h3 className="font-serif text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {venue.name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{venue.location}</p>
          <span className="mt-auto pt-1 text-sm font-medium text-primary">View venue</span>
        </div>
      </Link>
    </motion.article>
  );
}
