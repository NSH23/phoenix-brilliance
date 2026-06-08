import AutoScroll from "embla-carousel-auto-scroll";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { PartnerVenueCard, type PartnerVenueCardData } from "@/components/ui/partner-venue-card";

type PartnersVenueShowcaseProps = {
  venues: PartnerVenueCardData[];
  className?: string;
};

export function PartnersVenueShowcase({ venues, className }: PartnersVenueShowcaseProps) {
  if (venues.length === 0) return null;

  if (venues.length === 1) {
    return (
      <div className={cn("mx-auto max-w-sm px-5 sm:px-6 md:px-8", className)}>
        <PartnerVenueCard venue={venues[0]} />
      </div>
    );
  }

  const loopVenues = [...venues, ...venues];

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <Carousel
          opts={{ loop: true, align: "start", dragFree: true }}
          plugins={[
            AutoScroll({
              speed: 0.85,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              startDelay: 0,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {loopVenues.map((venue, index) => (
              <CarouselItem
                key={`${venue.id}-${index}`}
                className="basis-[78%] pl-3 sm:basis-[52%] md:basis-[38%] lg:basis-[28%] xl:basis-[24%] md:pl-4"
              >
                <PartnerVenueCard venue={venue} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}

export default PartnersVenueShowcase;
