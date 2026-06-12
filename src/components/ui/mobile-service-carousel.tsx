import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

type MobileServiceCarouselProps = {
  services: Array<{
    id: string | number;
    title: string;
    description: string;
    imgSrc: string;
    icon: ReactNode;
    fallbackImgSrc?: string;
  }>;
};

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";

export function MobileServiceCarousel({ services }: MobileServiceCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const toggleExpanded = (id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (services.length === 0) return null;

  return (
    <div className="w-full touch-pan-y pb-1">
      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: services.length > 1, containScroll: "trimSnaps", dragFree: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 touch-pan-y">
          {services.map((service, index) => {
            const isExpanded = expandedIds.has(service.id);
            const needsReadMore = service.description.trim().length > 120;

            return (
              <CarouselItem key={service.id} className="basis-[88%] pl-3 sm:basis-[82%]">
                <div
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-transform duration-300",
                    activeIndex === index ? "scale-100" : "scale-[0.97] opacity-90",
                    isExpanded ? "min-h-[380px]" : "h-[380px]",
                  )}
                >
                  <div className="relative h-[52%] shrink-0 w-full overflow-hidden bg-muted/20">
                    <img
                      src={service.imgSrc}
                      alt={service.title}
                      className="h-full w-full object-cover pointer-events-none"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        if (service.fallbackImgSrc) {
                          e.currentTarget.src = service.fallbackImgSrc;
                        } else {
                          e.currentTarget.src = DEFAULT_SERVICE_IMAGE;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md">
                      {service.icon}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-4 text-center">
                    <h3 className="font-serif text-lg font-semibold text-foreground">{service.title}</h3>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-relaxed text-muted-foreground",
                        !isExpanded && needsReadMore && "line-clamp-3",
                      )}
                    >
                      {service.description}
                    </p>
                    {needsReadMore ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(service.id)}
                        className="mt-3 inline-flex items-center justify-center gap-1 self-center text-xs font-semibold uppercase tracking-[0.12em] text-primary"
                      >
                        {isExpanded ? "Read less" : "Read more"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {services.length > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {services.map((service, i) => (
            <button
              key={service.id}
              type="button"
              aria-label={`Go to ${service.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
              )}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default MobileServiceCarousel;
