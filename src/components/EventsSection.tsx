import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getEventsForHomepage } from "@/services/events";
import { Loader2 } from "lucide-react";
import { StackedCards } from "@/components/ui/stacked-cards";

/* Event Categories: Three-column layout - left (StackedCards), center (categories), right (StackedCards).
 */

const FALLBACK_IMAGES = [
  "/wedding 1.jpg",
  "/gallery wedding.jpg",
  "/engagement.jpg",
  "/sangeet.jpg",
  "/haldi.jpg",
];

type EventCategory = {
  title: string;
  slug: string;
  description: string;
  images: string[];
  powered_by: string | null;
};

const EventsSection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const limit = 6;
    getEventsForHomepage(limit)
      .then((eventsData) => {
        const cats: EventCategory[] = (eventsData || []).map((e) => {
          const imgs = (e.event_images || [])
            .sort((a, b) => a.display_order - b.display_order)
            .map((i) => i.url);
          while (imgs.length < 6) {
            imgs.push(e.cover_image || FALLBACK_IMAGES[imgs.length % FALLBACK_IMAGES.length]);
          }
          return {
            title: e.title,
            slug: e.slug,
            description: e.short_description || e.description || "",
            images: imgs.slice(0, 6),
            powered_by: e.powered_by?.trim() || null,
          };
        });
        setCategories(cats);
        setSelectedSlug((prev) =>
          cats.find((c) => c.slug === prev) ? prev : cats[0]?.slug || ""
        );

        // Preload images for smoother transitions
        if (cats && cats.length > 0) {
          cats.forEach(cat => {
            cat.images.forEach(src => {
              const img = new Image();
              img.src = src;
            });
          });
        }
      })
      .catch(() => {
        setCategories([]);
        setSelectedSlug("");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const displayCategories = categories;
  const selectedCategory = displayCategories.find((c) => c.slug === selectedSlug) || displayCategories[0];

  // Split images into Left and Right stacks
  const { leftImages, rightImages } = useMemo(() => {
    const defaultImages = selectedCategory?.images || FALLBACK_IMAGES;
    // Split 6 images into 2 sets of 3
    return {
      leftImages: defaultImages.slice(0, 3),
      rightImages: defaultImages.slice(3, 6)
    };
  }, [selectedCategory]);


  if (isLoading && displayCategories.length === 0) {
    return (
      <section className="py-8 md:py-10 bg-transparent">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return (
      <section id="events" className="py-8 md:py-10 bg-transparent">
        <div className="text-center py-10">
          <p className="text-muted-foreground dark:text-ivory/70">No events to display. Add events in the admin dashboard.</p>
          <Link to="/events" className="mt-4 inline-block text-primary hover:underline">
            View Events Page
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="relative overflow-visible pt-12 md:pt-16 lg:pt-20 pb-0 bg-transparent z-20">
      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        {/* Header – editorial left-accent (same as Reels, Collaborations, About) */}
        <header className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1">
          <p className="text-primary font-sans font-semibold text-xs md:text-sm tracking-[0.2em] uppercase">
            What We Create
          </p>
          <h2 className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground dark:text-white">
            Event Categories
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground dark:text-white/70 text-base md:text-lg leading-relaxed font-sans">
            From intimate gatherings to grand celebrations, we bring every vision to life.
          </p>
        </header>
      </div>

        {/* Content container – glass; light: 9.jpg; dark: bg2.jpg behind container */}
        <div className="relative w-full rounded-2xl md:rounded-3xl border border-white/50 py-6 md:py-8 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.3)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] bg-white/5 backdrop-blur-sm dark:bg-black/10 dark:backdrop-blur-sm dark:border-white/25">
          {/* Light theme only: 9.jpg as section background – slightly above center, soft blur */}
          <div
            className="absolute inset-0 rounded-2xl md:rounded-3xl bg-cover bg-no-repeat opacity-100 dark:opacity-0 pointer-events-none z-0"
            style={{
              backgroundImage: "url('/9.jpg')",
              backgroundPosition: "center calc(50% - 2cm)",
              filter: "blur(5px)",
              transform: "scale(1.08)",
            }}
            aria-hidden
          />
          {/* Dark theme only: bg2.jpg – 1 cm above center */}
          <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-cover bg-no-repeat opacity-0 dark:opacity-100 pointer-events-none z-0" style={{ backgroundImage: "url('/bg2.jpg')", backgroundPosition: "center calc(50% - 1cm)" }} aria-hidden />
          {/* Dark: subtle gradient so text stays readable over the image */}
          <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-transparent dark:bg-gradient-to-b dark:from-black/40 dark:via-black/25 dark:to-black/50 pointer-events-none z-[1]" aria-hidden />
          <div className="relative z-10">
          {/* Mobile Marquee View */}
          <div className="block lg:hidden w-full overflow-hidden mb-6">
            <div className="collaborations-logo-mask overflow-hidden pt-2 pb-2">
            <div
              className="collaborations-logo-track flex gap-4 px-4"
              style={{
                animationDuration: '45s', // Optimized speed
                width: 'max-content',
                willChange: 'transform' // Hardware acceleration
              }}
            >
              {/* Duplicate enough times to ensure no gaps */}
              {[...categories, ...categories, ...categories, ...categories].map((cat, index) => (
                <Link
                  key={`${cat.slug}-mobile-${index}`}
                  to={`/events/${cat.slug}`}
                  className="flex-shrink-0 w-[200px] group relative rounded-xl overflow-hidden aspect-[3/4] border border-border dark:border-white/10 bg-card shadow-elevation-1 dark:shadow-elevation-1-dark transition-all duration-300 ease-out hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:ring-1 hover:ring-primary/20 hover:-translate-y-1"
                >
                  <img
                    src={cat.images[0] || FALLBACK_IMAGES[0]}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <h3 className="text-white font-serif text-lg font-semibold tracking-wide">{cat.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
            </div>
          </div>

        {/* Desktop Three-column layout – Hidden on Mobile, constrained to previous width so stacked cards stay same size */}
        <div className="hidden lg:block max-w-7xl mx-auto">
        <div className="lg:grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-10 items-center mt-4">

          {/* Left column - StackedCards (larger by using more of column) */}
          <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col items-center justify-center py-6 h-[450px] md:h-[550px] relative">
            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2">
              <StackedCards items={leftImages} autoplay={false} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSlug}
                className="text-center lg:text-right max-w-md lg:max-w-none relative z-20 mt-3 min-h-[4rem]"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-muted-foreground dark:text-ivory/90 text-base md:text-lg leading-relaxed hidden lg:block">
                  {selectedCategory?.description || ""}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Center: Categories */}
          <div className="lg:col-span-4 order-1 lg:order-2 flex flex-col items-center justify-center py-4 lg:py-0">
            <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
              {displayCategories.map((cat) => {
                const isActive = cat.slug === selectedSlug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onMouseEnter={() => setSelectedSlug(cat.slug)}
                    onClick={() => {
                      setSelectedSlug(cat.slug);
                      navigate(`/events/${cat.slug}`);
                    }}
                    className="text-center cursor-pointer block w-full bg-transparent border-0 p-0 font-inherit"
                  >
                    <span
                      className={`block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-semibold tracking-tight transition-all duration-300 ease-out
                        ${isActive ? "text-foreground dark:text-ivory border-b-2 border-primary dark:border-ivory pb-2 scale-105" : "text-muted-foreground dark:text-ivory/70 hover:text-foreground dark:hover:text-ivory"}`}
                    >
                      {cat.title.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Description shown on mobile in center (below categories) */}
            <div className="mt-6 lg:hidden max-w-md text-center">
              <p className="text-muted-foreground dark:text-ivory/90 text-sm leading-relaxed">
                {selectedCategory?.description || ""}
              </p>
            </div>
          </div>

          {/* Right column - StackedCards (same larger size as left) */}
          <div className="hidden lg:flex lg:col-span-4 order-3 flex-col items-center justify-center py-6 h-[450px] md:h-[550px] relative">
            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2">
              <StackedCards items={rightImages} autoplay={false} />
            </div>
          </div>
        </div>
        </div>

        {/* View All Events – inside container */}
        <div className="text-center mt-6 md:mt-8 pb-6 md:pb-8">
          <Link to="/events" className="btn-section-cta">
            <span>View All Events</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
          </div>
        </div>
    </section>
  );
};

export default EventsSection;
