import AutoScroll from "embla-carousel-auto-scroll";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { PartnerVenueCard, type PartnerVenueCardData } from "@/components/ui/partner-venue-card";

type PartnersVenueShowcaseProps = {
  venues: PartnerVenueCardData[];
  className?: string;
  /** Full viewport width — first card flush to the left edge */
  edgeToEdge?: boolean;
};

export function PartnersVenueShowcase({ venues, className, edgeToEdge = false }: PartnersVenueShowcaseProps) {
  if (venues.length === 0) return null;

  if (venues.length === 1) {
    return (
      <div
        className={cn(
          edgeToEdge ? "px-5 sm:px-6 lg:px-8" : "mx-auto max-w-sm px-5 sm:px-6 md:px-8",
          className,
        )}
      >
        <div className={edgeToEdge ? "mx-auto max-w-sm" : undefined}>
          <PartnerVenueCard venue={venues[0]} />
        </div>
      </div>
    );
  }

  const loopVenues = [...venues, ...venues];

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
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
        <CarouselContent
          className={cn(
            edgeToEdge ? "-ml-0 gap-4 md:gap-5" : "-ml-4 gap-4 md:-ml-5 md:gap-5",
          )}
        >
          {loopVenues.map((venue, index) => (
            <CarouselItem
              key={`${venue.id}-${index}`}
              className={cn(
                "pl-0",
                edgeToEdge
                  ? "basis-[86%] sm:basis-[56%] md:basis-[42%] lg:basis-[32%] xl:basis-[28%]"
                  : "basis-[88%] sm:basis-[58%] md:basis-[44%] lg:basis-[34%] xl:basis-[30%]",
              )}
            >
              <PartnerVenueCard venue={venue} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

export default PartnersVenueShowcase;
