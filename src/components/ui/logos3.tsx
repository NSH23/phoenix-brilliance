import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { cn } from "@/lib/utils";

interface VenueItem {
  name: string;
  image: string;
  alt: string;
  location: string;
  type: string;
}

interface VenueCarouselProps {
  venues: VenueItem[];
  direction?: "forward" | "backward";
  speed?: number;
  className?: string;
}

const VenueCarousel = ({
  venues,
  direction = "forward",
  speed = 0.5,
  className,
}: VenueCarouselProps) => {
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
      containScroll: false,
    },
    [
      AutoScroll({
        speed,
        direction,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        startDelay: 0,
      }),
    ]
  );

  return (
    <div className={cn("overflow-hidden", className)} ref={emblaRef}>
      <div className="flex gap-5">
        {venues.map((venue, index) => (
          <div
            key={`${venue.name}-${index}`}
            className="flex-none w-[280px] sm:w-[300px] lg:w-[320px]"
          >
            <div className="group bg-card rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(231,183,200,0.25)] hover:shadow-[0_16px_35px_rgba(231,183,200,0.35)] transition-shadow duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={venue.image}
                  alt={venue.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-display text-base font-medium truncate pr-2">
                    {venue.name}
                  </h3>
                  <span className="text-[11px] font-sans text-accent-foreground bg-accent px-2 py-0.5 rounded-sm whitespace-nowrap">
                    {venue.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  {venue.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { VenueCarousel };
export type { VenueItem };

