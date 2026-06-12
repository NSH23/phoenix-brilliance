import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { PartnerVenueCard, type PartnerVenueCardData } from "@/components/ui/partner-venue-card";
import { venueDetailPath } from "@/lib/venueRoutes";

type MobilePartnersShowcaseProps = {
  venues: PartnerVenueCardData[];
  className?: string;
};

export function MobilePartnersShowcase({ venues, className }: MobilePartnersShowcaseProps) {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap() % venues.length);
    const onScroll = () => {
      draggedRef.current = true;
    };
    const onSettle = () => {
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 80);
    };

    onSelect();
    api.on("select", onSelect);
    api.on("scroll", onScroll);
    api.on("settle", onSettle);

    return () => {
      api.off("select", onSelect);
      api.off("scroll", onScroll);
      api.off("settle", onSettle);
    };
  }, [api, venues.length]);

  useEffect(() => {
    if (!api) return;
    api.reInit();
  }, [api, venues]);

  const openVenue = useCallback(
    (venueId: string) => {
      if (draggedRef.current) return;
      navigate(venueDetailPath(venueId));
    },
    [navigate],
  );

  if (venues.length === 0) return null;

  if (venues.length === 1) {
    return (
      <div className={cn("px-4", className)}>
        <PartnerVenueCard
          venue={venues[0]}
          variant="mobile"
          motionless
          interactive="button"
          onPress={() => openVenue(venues[0].id)}
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full touch-pan-y pb-1", className)}>
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
          containScroll: "trimSnaps",
          dragFree: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 touch-pan-y">
          {venues.map((venue, index) => (
            <CarouselItem key={venue.id} className="basis-[85%] pl-3 sm:basis-[78%]">
              <PartnerVenueCard
                venue={venue}
                variant="mobile"
                motionless
                interactive="button"
                onPress={() => openVenue(venue.id)}
                className={cn(
                  "transition-transform duration-300",
                  activeIndex === index ? "scale-100" : "scale-[0.97] opacity-90",
                )}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-4 flex justify-center gap-1.5 px-4">
        {venues.map((venue, i) => (
          <button
            key={venue.id}
            type="button"
            aria-label={`Go to ${venue.name}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
            )}
            onClick={() => api?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default MobilePartnersShowcase;
