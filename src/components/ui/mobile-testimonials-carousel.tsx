import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

export type MobileTestimonial = {
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating?: number;
};

type MobileTestimonialsCarouselProps = {
  testimonials: MobileTestimonial[];
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hasRealAvatar(avatar: string) {
  return avatar && !avatar.includes("unsplash.com") && !avatar.includes("ui-avatars.com");
}

export function MobileTestimonialsCarousel({ testimonials, className }: MobileTestimonialsCarouselProps) {
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

  if (testimonials.length === 0) return null;

  return (
    <div className={cn("w-full pb-2", className)}>
      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: testimonials.length > 1, containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {testimonials.map((testimonial, index) => {
            const stars = testimonial.rating ?? 5;
            return (
              <CarouselItem key={`${testimonial.name}-${index}`} className="basis-[90%] pl-3 sm:basis-[84%]">
                <article
                  className={cn(
                    "flex min-h-[280px] flex-col rounded-3xl border border-border/50 bg-card/90 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-transform duration-300",
                    activeIndex === index ? "scale-100" : "scale-[0.97] opacity-90",
                  )}
                >
                  <Quote className="h-7 w-7 text-primary/70" aria-hidden />
                  <div className="mt-2 flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < stars ? "fill-primary text-primary" : "text-muted-foreground/25",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-4">
                    <Avatar className="h-10 w-10 border border-border/60">
                      {hasRealAvatar(testimonial.avatar) ? (
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(testimonial.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{testimonial.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {testimonials.length > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {testimonials.map((t, i) => (
            <button
              key={`dot-${t.name}-${i}`}
              type="button"
              aria-label={`Go to testimonial from ${t.name}`}
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

export default MobileTestimonialsCarousel;
