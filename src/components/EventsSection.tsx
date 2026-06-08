import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getEventsForHomepage } from "@/services/events";
import { Loader2 } from "lucide-react";
import { StackedCards } from "@/components/ui/stacked-cards";
import { EventCategoryCard } from "@/components/ui/event-category-card";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { EVENT_CATEGORY_DESCRIPTIONS } from "@/data/eventCategoryCopy";

/* Event Categories: Three-column layout - left (StackedCards), center (categories), right (StackedCards).
 */

const FALLBACK_IMAGES = [
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
];

type EventCategory = {
  title: string;
  slug: string;
  description: string;
  images: string[];
  powered_by: string | null;
};

type HomepageEventRow = Awaited<ReturnType<typeof getEventsForHomepage>>[number];

function buildEventCategories(eventsData: HomepageEventRow[]): EventCategory[] {
  return (eventsData || []).map((e) => {
    const imgs = (e.event_images || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((i) => i.url);
    while (imgs.length < 6) {
      imgs.push(e.cover_image || FALLBACK_IMAGES[imgs.length % FALLBACK_IMAGES.length]);
    }
    return {
      title: e.title,
      slug: e.slug,
      description: EVENT_CATEGORY_DESCRIPTIONS[e.slug] || e.short_description || e.description || "",
      images: imgs.slice(0, 6),
      powered_by: e.powered_by?.trim() || null,
    };
  });
}

function preloadCategoryImages(cats: EventCategory[]) {
  if (!cats.length) return;
  cats.forEach((cat) => {
    cat.images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  });
}

type EventsSectionProps = {
  prefetchedEvents?: Awaited<ReturnType<typeof getEventsForHomepage>>;
  homepageDataPending?: boolean;
};

const EventsSection = ({ prefetchedEvents, homepageDataPending }: EventsSectionProps = {}) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedEvents !== undefined) {
      const cats = buildEventCategories(prefetchedEvents);
      setCategories(cats);
      setSelectedSlug((prev) => (cats.find((c) => c.slug === prev) ? prev : cats[0]?.slug || ""));
      preloadCategoryImages(cats);
      setIsLoading(false);
      return;
    }

    const limit = 7;
    getEventsForHomepage(limit)
      .then((eventsData) => {
        const cats = buildEventCategories(eventsData || []);
        setCategories(cats);
        setSelectedSlug((prev) => (cats.find((c) => c.slug === prev) ? prev : cats[0]?.slug || ""));
        preloadCategoryImages(cats);
      })
      .catch(() => {
        setCategories([]);
        setSelectedSlug("");
      })
      .finally(() => setIsLoading(false));
  }, [prefetchedEvents, homepageDataPending]);

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
    <HomeSectionShell
      ariaLabelledBy="events-heading"
      badge="What We Create"
      title={<HomeSectionSplitTitle line1="Event" accent="Categories" />}
      fullBleed
      contentClassName="pb-2 pt-2 md:pb-4 md:pt-4"
    >
        <div className="relative w-full overflow-hidden border-y border-border/40 py-6 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] dark:border-white/10 dark:shadow-none">
          {/* Light theme only: 9.jpg as section background – slightly above center, soft blur */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat opacity-100 dark:opacity-0 pointer-events-none z-0"
            style={{
              backgroundImage: "var(--bg-image-9, url('/9.jpg'))",
              backgroundPosition: "center calc(50% - 2cm)",
              filter: "blur(5px)",
              transform: "scale(1.08)",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-cover bg-no-repeat opacity-0 dark:opacity-100 pointer-events-none z-0" style={{ backgroundImage: "var(--bg-image-bg2, url('/bg2.jpg'))", backgroundPosition: "center calc(50% - 1cm)" }} aria-hidden />
          <div className="absolute inset-0 bg-white/45 dark:bg-gradient-to-b dark:from-black/40 dark:via-black/25 dark:to-black/50 pointer-events-none z-[1]" aria-hidden />
          <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="block lg:hidden w-full mb-6">
            <div className="overflow-x-auto overflow-y-hidden pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x">
              <div className="flex gap-4 w-max snap-x snap-mandatory px-1">
                {categories.map((cat) => (
                  <EventCategoryCard
                    key={`${cat.slug}-mobile`}
                    title={cat.title}
                    slug={cat.slug}
                    coverUrl={cat.images[0] || FALLBACK_IMAGES[0]}
                  />
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
    </HomeSectionShell>
  );
};

export default EventsSection;
