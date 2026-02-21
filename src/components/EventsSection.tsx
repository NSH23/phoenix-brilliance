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
      <section className="home-section bg-muted dark:bg-charcoal">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return (
      <section id="events" className="home-section bg-muted dark:bg-charcoal py-12 sm:py-16">
        <div className="text-center py-16">
          <p className="text-muted-foreground dark:text-ivory/70">No events to display. Add events in the admin dashboard.</p>
          <Link to="/events" className="mt-4 inline-block text-primary hover:underline">
            View Events Page
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="relative home-section overflow-visible pt-4 sm:pt-6 lg:pt-8 pb-8 lg:pb-12 bg-background">


      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        {/* Header - extra margin so text doesn't overlap images below */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <p className="section-eyebrow text-primary font-medium tracking-wider" style={{ whiteSpace: "nowrap" }}>What We Create</p>
          <h2 className="section-heading text-4xl md:text-5xl font-bold text-foreground dark:text-white">Event Categories</h2>
        </div>

        {/* Mobile Marquee View */}
        <div className="block lg:hidden w-full overflow-hidden mb-8">
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
                  className="flex-shrink-0 w-[200px] group relative rounded-xl overflow-hidden aspect-[3/4]"
                >
                  <img
                    src={cat.images[0] || FALLBACK_IMAGES[0]}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                    <h3 className="text-white font-display text-lg font-bold tracking-wide">{cat.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Three-column layout - Hidden on Mobile */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-10 items-center">

          {/* Left column - StackedCards */}
          <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col items-center justify-center py-10 h-[450px] md:h-[550px] relative">
            <div className="w-full h-full flex items-center justify-center p-4">
              <StackedCards items={leftImages} autoplay={false} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSlug}
                className="text-center lg:text-right max-w-sm lg:max-w-none relative z-20 mt-4 min-h-[4rem]"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-muted-foreground dark:text-ivory/90 text-sm sm:text-base leading-relaxed hidden lg:block">
                  {/* Shown on desktop below left stack, or hide if desired layout differs */}
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
                      className={`block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight transition-all duration-300 ease-out font-display
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

          {/* Right column - StackedCards - HIDDEN ON MOBILE */}
          <div className="hidden lg:flex lg:col-span-4 order-3 flex-col items-center justify-center py-10 h-[450px] md:h-[550px] relative">
            <div className="w-full h-full flex items-center justify-center p-4">
              <StackedCards items={rightImages} autoplay={false} />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/events" className="btn-section-cta">
            <span>View All Events</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
