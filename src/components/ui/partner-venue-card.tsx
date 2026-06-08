import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card-2";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { venueDetailPath } from "@/lib/venueRoutes";

export type PartnerVenueCardData = {
  id: string;
  name: string;
  location: string;
  logoUrl: string;
  bannerUrl?: string | null;
};

type PartnerVenueCardProps = {
  venue: PartnerVenueCardData;
  className?: string;
};

export function PartnerVenueCard({ venue, className }: PartnerVenueCardProps) {
  const cover = venue.bannerUrl || null;

  return (
    <Link
      to={venueDetailPath(venue.id)}
      className={cn("group block h-full touch-manipulation", className)}
    >
      <Card className="flex h-full flex-col border-border/60 bg-card/95 backdrop-blur-sm">
        <CardContent className="relative p-0">
          <AspectRatio ratio={4 / 3} className="bg-muted">
            {cover ? (
              <>
                <OptimizedImage
                  src={cover}
                  alt=""
                  aria-hidden
                  preset="banner"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
              </>
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/15 via-muted to-primary/5" />
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/90 p-1.5 shadow-sm dark:bg-card/90">
                  <OptimizedImage
                    src={venue.logoUrl}
                    alt=""
                    preset="thumb"
                    responsive={false}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold text-white drop-shadow-sm sm:text-base">
                    {venue.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 line-clamp-1 text-[11px] text-white/80">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {venue.location}
                  </p>
                </div>
              </div>
            </div>
          </AspectRatio>
        </CardContent>
      </Card>
    </Link>
  );
}
