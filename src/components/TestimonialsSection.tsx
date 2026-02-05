import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import { getFeaturedTestimonials } from "@/services/testimonials";

/* Testimonials section: floating cards on desktop (6 cards), stacked grid on mobile.
 */

interface Testimonial {
  name: string;
  event: string;
  rating: number;
  quote: string;
  image: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    rating: 5,
    quote:
      "The entire décor was perfect, exactly the way I wanted it. The whole team was extremely polite and professional. I am very happy with their work.",
    name: "Vartika Srivastava",
    event: "Celebration Event",
    image: "",
  },
  {
    rating: 5,
    quote:
      "Outstanding service from start to finish! They captured every moment beautifully and made our wedding day absolutely perfect.",
    name: "Priya & Rahul Sharma",
    event: "Wedding Ceremony",
    image: "",
  },
  {
    rating: 5,
    quote:
      "Professional, creative, and attentive to every detail. Our engagement photos exceeded all expectations!",
    name: "Ananya Gupta",
    event: "Engagement Shoot",
    image: "",
  },
  {
    rating: 5,
    quote:
      "The team's creativity and dedication made our corporate event a huge success. Highly recommended!",
    name: "Vikram Mehta",
    event: "Corporate Event",
    image: "",
  },
  {
    rating: 5,
    quote:
      "From planning to execution, everything was flawless. They truly understand what makes events special.",
    name: "Sneha Kapoor",
    event: "Haldi Ceremony",
    image: "",
  },
  {
    rating: 5,
    quote:
      "Incredible attention to detail and exceptional customer service. They made our day unforgettable!",
    name: "Rohan & Meera Patel",
    event: "Reception Party",
    image: "",
  },
];

function getAvatarUrl(name: string, existingUrl?: string): string {
  if (existingUrl) return existingUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=80&background=random`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "fill-[var(--testimonial-star-filled)] text-[var(--testimonial-star-filled)]" : "fill-[var(--testimonial-star-empty)] text-[var(--testimonial-star-empty)]"
          }`}
        />
      ))}
    </div>
  );
}

const FLOATING_POSITIONS = [
  { top: "5%", left: "12%" },
  { top: "18%", left: "58%" },
  { top: "30%", left: "8%" },
  { top: "24%", left: "72%" },
  { top: "42%", left: "38%" },
  { top: "52%", left: "18%" },
] as const;

const FLOATING_CLASSES = [
  "testimonial-float-card-1",
  "testimonial-float-card-2",
  "testimonial-float-card-3",
  "testimonial-float-card-4",
  "testimonial-float-card-5",
  "testimonial-float-card-6",
] as const;

function TestimonialCard({
  testimonial,
  floating = false,
  floatClass,
  position,
}: {
  testimonial: Testimonial;
  floating?: boolean;
  floatClass?: string;
  position?: { top: string; left: string };
}) {
  const avatarUrl = getAvatarUrl(testimonial.name, testimonial.image);

  const cardClass = "testimonial-card p-3 sm:p-4 h-full flex flex-col min-h-[180px] w-full";
  const floatingWrapperClass = [
    "absolute w-[260px] max-w-[90vw]",
    floatClass,
    floating && "testimonial-card-floating",
  ]
    .filter(Boolean)
    .join(" ");

  const cardContent = (
    <article className={cardClass}>
      <div className="mb-1.5">
        <Quote
          className="w-6 h-6 opacity-25"
          style={{ color: "var(--testimonial-quote-color)" }}
          aria-hidden
        />
      </div>

      <div className="mb-2">
        <StarRating rating={testimonial.rating} />
      </div>

      <blockquote className="flex-1 text-sm leading-relaxed mb-3 line-clamp-4" style={{ color: "var(--testimonial-text)" }}>
        <span className="italic">&quot;{testimonial.quote}&quot;</span>
      </blockquote>

      <div className="flex items-center gap-2.5 pt-2.5 border-t border-border">
        <img
          src={avatarUrl}
          alt={testimonial.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-card shadow-sm flex-shrink-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getAvatarUrl(testimonial.name);
          }}
        />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--testimonial-name)" }}>
            {testimonial.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--testimonial-event)" }}>
            {testimonial.event}
          </p>
        </div>
      </div>
    </article>
  );

  if (floating && position && floatClass) {
    return (
      <div className={floatingWrapperClass} style={{ top: position.top, left: position.left }}>
        {cardContent}
      </div>
    );
  }

  return cardContent;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    getFeaturedTestimonials(8)
      .then((data) => {
        if (data.length > 0) {
          setTestimonials(
            data.map((t) => ({
              name: t.name,
              event: t.event_type || t.role || "",
              rating: t.rating ?? 5,
              quote: t.content,
              image: t.avatar || "",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const list = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;
  const displayList = list.slice(0, 6);

  return (
    <section
      id="testimonials"
      className="relative py-10 sm:py-12 lg:py-16"
      style={{ background: "var(--testimonial-floating-bg)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="home-section-inner relative">
        <header className="text-center mb-5 sm:mb-6">
          <p className="section-eyebrow text-primary">Kind Words</p>
          <h2 className="section-heading">Testimonials</h2>
          <p className="section-description">
            Hear from those who trusted us with their special moments.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-5 mb-5">
          <div className="text-center">
            <p className="text-xl font-bold text-primary">500+</p>
            <p className="text-xs text-muted-foreground">Happy Clients</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">4.9/5.0</p>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </div>
        </div>

        {/* Mobile / Tablet: stacked grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-4">
          {displayList.map((t, i) => (
            <TestimonialCard key={t.name + t.event + i} testimonial={t} />
          ))}
        </div>
      </div>

      {/* Desktop: full-width floating layout - overflow-visible so cards are never cut */}
      <div className="hidden lg:block relative w-full min-h-[480px] overflow-visible px-6 lg:px-8 pb-8">
        {displayList.map((t, i) => (
          <TestimonialCard
            key={t.name + t.event + i}
            testimonial={t}
            floating
            floatClass={FLOATING_CLASSES[i]}
            position={FLOATING_POSITIONS[i]}
          />
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
