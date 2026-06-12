import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating?: number;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  testimonials: Testimonial[];
  className?: string;
  showHeader?: boolean;
  embedded?: boolean;
}

export function TestimonialsSection({
  title = "Trusted by thousands of teams",
  subtitle = "See what our customers have to say about us.",
  badgeText = "Testimonials",
  testimonials,
  className,
  showHeader = true,
  embedded = false,
}: TestimonialsSectionProps) {
  const gridContent = (
    <>
      {showHeader ? (
        <header className="mb-8 space-y-1 border-l-4 border-primary pl-5 md:mb-10 md:pl-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm">
            {badgeText}
          </p>
          <h2 className="font-serif text-3xl font-medium leading-tight text-foreground dark:text-white md:text-4xl lg:text-5xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-muted-foreground dark:text-white/70 md:text-lg">
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-3",
          embedded ? "gap-3.5 py-0" : "gap-4 py-4",
        )}
      >
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} testimonial={t} />
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div className={cn("w-full", className)}>{gridContent}</div>;
  }

  return (
    <section id="testimonials" className={cn("w-full py-4 md:py-10 lg:py-12", className)}>
      <div className="container mx-auto max-w-7xl px-4">{gridContent}</div>
    </section>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const stars = typeof testimonial.rating === "number" ? testimonial.rating : 5;
  const hasRealAvatar =
    testimonial.avatar &&
    !testimonial.avatar.includes("unsplash.com") &&
    !testimonial.avatar.includes("ui-avatars.com");

  return (
    <Card className="testimonial-card-item flex h-full flex-col rounded-2xl border border-border/70 bg-white/85 shadow-[0_8px_28px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:border-white/15 dark:bg-card/90 dark:shadow-elevation-1-dark dark:hover:border-primary/40">
      <CardHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`h-4 w-4 ${
                  idx < stars
                    ? "fill-primary text-primary"
                    : "fill-muted/20 text-muted text-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="line-clamp-4 italic text-muted-foreground">&ldquo;{testimonial.text}&rdquo;</p>
      </CardContent>
      <CardFooter className="mt-auto p-4 pt-0">
        <div className="flex items-center gap-4">
          {hasRealAvatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="h-10 w-10 rounded-full border border-border object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-medium text-primary"
              aria-hidden
            >
              {getInitials(testimonial.name)}
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
