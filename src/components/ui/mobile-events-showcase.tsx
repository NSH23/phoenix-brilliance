import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export type MobileEventCategory = {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
};

type MobileEventsShowcaseProps = {
  categories: MobileEventCategory[];
  className?: string;
};

export function MobileEventsShowcase({ categories, className }: MobileEventsShowcaseProps) {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (categories.length === 0) return null;

  const active = categories[activeIndex] ?? categories[0];

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
    setActiveIndex(index);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/70 bg-card/80 text-muted-foreground",
              )}
            >
              {cat.title}
            </button>
          );
        })}
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: categories.length > 1, containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {categories.map((cat, index) => (
            <CarouselItem key={cat.slug} className="basis-[88%] pl-3 sm:basis-[82%]">
              <button
                type="button"
                onClick={() => navigate(`/events/${cat.slug}`)}
                className={cn(
                  "group block w-full overflow-hidden rounded-3xl border border-border/50 bg-card text-left shadow-[0_14px_36px_rgba(0,0,0,0.12)] transition-transform duration-300",
                  activeIndex === index ? "scale-100" : "scale-[0.97] opacity-90",
                )}
              >
                <AspectRatio ratio={4 / 5} className="w-full bg-muted">
                  <div className="absolute inset-0">
                    <OptimizedImage
                      src={cat.coverUrl}
                      alt={cat.title}
                      preset="card"
                      className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-serif text-xl font-semibold leading-tight text-white">{cat.title}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/85">
                        {cat.description}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/95">
                        Explore category
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </AspectRatio>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {categories.length > 1 ? (
        <div className="flex justify-center gap-1.5">
          {categories.map((cat, i) => (
            <button
              key={`dot-${cat.slug}`}
              type="button"
              aria-label={`Go to ${cat.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
              )}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      ) : null}

      <p className="px-1 text-center text-sm leading-relaxed text-muted-foreground">{active.description}</p>

      <div className="text-center pt-1">
        <Link to="/events" className="btn-section-cta inline-flex">
          <span>View All Events</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

export default MobileEventsShowcase;
