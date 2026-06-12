import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { PartnerVenueCard, type PartnerVenueCardData } from "@/components/ui/partner-venue-card";

type MobilePartnersShowcaseProps = {
  venues: PartnerVenueCardData[];
  className?: string;
};

export function MobilePartnersShowcase({ venues, className }: MobilePartnersShowcaseProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap() % venues.length);
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, venues.length]);

  if (venues.length === 0) return null;

  if (venues.length === 1) {
    return (
      <div className={cn("px-4", className)}>
        <PartnerVenueCard venue={venues[0]} variant="mobile" />
      </div>
    );
  }

  return (
    <div className={cn("w-full pb-1", className)}>
      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: true, containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {venues.map((venue, index) => (
            <CarouselItem key={venue.id} className="basis-[88%] pl-3 sm:basis-[78%]">
              <PartnerVenueCard
                venue={venue}
                index={index}
                variant="mobile"
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
