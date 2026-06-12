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
  variant?: "default" | "mobile";
};

export function PartnerVenueCard({ venue, index = 0, className, variant = "default" }: PartnerVenueCardProps) {
  const cover = venue.bannerUrl || null;
  const isMobile = variant === "mobile";

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
          "flex h-full flex-col overflow-hidden border bg-card transition-all duration-300",
          isMobile
            ? "rounded-2xl border-border/50 shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-[0.99]"
            : "rounded-2xl border-border/60 shadow-sm hover:border-primary/25 hover:shadow-md",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
        aria-label={`View ${venue.name}`}
      >
        <AspectRatio ratio={isMobile ? 4 / 3 : 4 / 3} className="w-full bg-muted">
          <div className="absolute inset-0">
            {cover ? (
              <OptimizedImage
                src={cover}
                alt=""
                aria-hidden
                preset="banner"
                className={cn(
                  "h-full w-full object-cover transition-transform duration-500",
                  !isMobile && "group-hover:scale-[1.03]",
                )}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted via-muted/80 to-primary/5" />
            )}
            {isMobile ? (
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            ) : null}
            <div
              className={cn(
                "absolute flex items-center justify-center rounded-lg border border-white/25 bg-white/95 p-1 shadow-sm dark:bg-card/95",
                isMobile ? "bottom-2 left-2 h-9 w-9 rounded-lg" : "bottom-3.5 left-3.5 h-11 w-11",
              )}
            >
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

        <div className={cn("flex flex-1 flex-col gap-1.5", isMobile ? "p-3" : "p-4 sm:p-5")}>
          <h3
            className={cn(
              "font-serif font-semibold leading-snug text-foreground",
              isMobile ? "text-sm line-clamp-2" : "text-lg sm:text-xl",
            )}
          >
            {venue.name}
          </h3>
          <p className={cn("line-clamp-2 text-muted-foreground", isMobile ? "text-[11px] leading-snug" : "text-sm")}>
            {venue.location}
          </p>
          <span className={cn("mt-auto pt-0.5 font-medium text-primary", isMobile ? "text-[10px]" : "text-sm")}>
            View venue →
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
