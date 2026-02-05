import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getEventsForHomepage } from "@/services/events";
import { getSiteSettingOptional } from "@/services/siteContent";
import { GALLERY_FRAME_TEMPLATES, type GalleryFrameTemplateId } from "@/lib/galleryFrames";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/* Event Categories: Three-column layout - left (text + frames), center (categories), right (2 frames).
 * Top 5 events by display_order. Hover category → switch images & description.
 * Frame style configurable via admin.
 */

const FALLBACK_IMAGES = [
  "/wedding 1.jpg",
  "/gallery wedding.jpg",
  "/engagement.jpg",
  "/sangeet.jpg",
  "/haldi.jpg",
];

function EventFrame({
  src,
  alt,
  rotationDeg,
  slug,
  frameId,
  className = "",
  behind = false,
  revealOnHover = false,
  isHovered = false,
  slideDirection = "left",
}: {
  src: string;
  alt: string;
  rotationDeg: number;
  slug?: string;
  frameId: GalleryFrameTemplateId;
  className?: string;
  behind?: boolean;
  revealOnHover?: boolean;
  isHovered?: boolean;
  slideDirection?: "left" | "right";
}) {
  const revealOffsetX = revealOnHover && isHovered ? (slideDirection === "left" ? -64 : 64) : 0;
  const revealOffsetY = revealOnHover && isHovered ? -8 : 0;
  const isRevealed = revealOnHover && isHovered;
  const content = (
    <motion.div
      className={cn(
        "flex-shrink-0 origin-center",
        className,
        behind && "opacity-90",
        isRevealed ? "z-30" : "z-0"
      )}
      style={{ transformOrigin: "center center" }}
      initial={{ opacity: 0, scale: behind ? 0.88 : 0.96 }}
      animate={{
        x: revealOffsetX,
        y: revealOffsetY,
        rotate: rotationDeg,
        opacity: behind ? (isHovered && revealOnHover ? 1 : 0.9) : 1,
        scale: behind ? (isHovered && revealOnHover ? 0.98 : 0.85) : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
        mass: 0.8,
      }}
    >
      <div
        className={cn(
          "relative overflow-visible",
          frameId === "polaroid" &&
            "bg-white p-5 pb-14 rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.4),0_16px_50px_rgba(0,0,0,0.25)] border-4 border-white",
          frameId === "rounded" && "bg-white p-3 rounded-2xl shadow-lg",
          frameId === "shadow" &&
            "bg-white p-2 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-black/5",
          frameId === "vintage" &&
            "bg-amber-50/90 p-4 rounded-sm border-2 border-amber-200/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]",
          frameId === "minimal" && "bg-white p-1 rounded border border-black/10"
        )}
      >
        <div
          className={cn(
            "aspect-[4/5] overflow-hidden bg-muted",
            frameId === "polaroid" && "rounded-sm",
            frameId === "rounded" && "rounded-xl",
            frameId === "shadow" && "rounded-md",
            frameId === "vintage" && "rounded-sm",
            frameId === "minimal" && "rounded-sm"
          )}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <Link to={slug ? `/events/${slug}` : "/events"} className="block">
      {content}
    </Link>
  );
}

type EventCategory = {
  title: string;
  slug: string;
  description: string;
  images: string[];
  powered_by: string | null;
};

type HoveredStack = "left" | "right" | null;

const EventsSection = () => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [frameId, setFrameId] = useState<GalleryFrameTemplateId>("polaroid");
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStack, setHoveredStack] = useState<HoveredStack>(null);

  useEffect(() => {
    const limit = 5;
    Promise.all([
      getEventsForHomepage(limit),
      getSiteSettingOptional("homepage_events_frame_template"),
    ])
      .then(([eventsData, frameVal]) => {
        setFrameId(
          frameVal && frameVal in GALLERY_FRAME_TEMPLATES
            ? (frameVal as GalleryFrameTemplateId)
            : "polaroid"
        );
        const cats: EventCategory[] = (eventsData || []).map((e) => {
          const imgs = (e.event_images || [])
            .sort((a, b) => a.display_order - b.display_order)
            .map((i) => i.url);
          while (imgs.length < 5) {
            imgs.push(e.cover_image || FALLBACK_IMAGES[imgs.length % FALLBACK_IMAGES.length]);
          }
          return {
            title: e.title,
            slug: e.slug,
            description: e.short_description || e.description || "",
            images: imgs.slice(0, 5),
            powered_by: e.powered_by?.trim() || null,
          };
        });
        setCategories(cats);
        setSelectedSlug((prev) =>
          cats.find((c) => c.slug === prev) ? prev : cats[0]?.slug || ""
        );
      })
      .catch(() => {
        setCategories([]);
        setSelectedSlug("");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const displayCategories = categories;
  const selectedCategory = displayCategories.find((c) => c.slug === selectedSlug) || displayCategories[0];
  const selectedIndex = displayCategories.findIndex((c) => c.slug === selectedSlug);
  const isLayoutA = selectedIndex % 2 === 0;
  const images = selectedCategory?.images || FALLBACK_IMAGES;
  const img0 = images[0] || "/placeholder.svg";
  const img1 = images[1] || "/placeholder.svg";
  const img2 = images[2] || "/placeholder.svg";
  const img3 = images[3] || "/placeholder.svg";
  const img4 = images[4] || "/placeholder.svg";

  const polaroidSize = "w-[220px] sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[320px]";

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
      <section id="events" className="home-section bg-muted dark:bg-charcoal py-20 sm:py-24 lg:py-28">
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
    <section id="events" className="relative home-section bg-muted dark:bg-charcoal overflow-visible pt-4 sm:pt-6 lg:pt-8 pb-16 lg:pb-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header - extra margin so text doesn't overlap images below */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-14">
          <p className="section-eyebrow text-muted-foreground dark:text-ivory/70">What We Create</p>
          <h2 className="section-heading text-foreground dark:text-ivory">Event Categories</h2>
        </div>

        {/* Three-column layout: Layout A (Wedding,Engagement,Haldi) = 1 left+text, center, 2 right. Layout B = 2 left, center, 1 right+text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-10 items-start">
          {/* Left column - fixed height container to prevent layout shift */}
          <div
            className="lg:col-span-4 order-2 lg:order-1 relative min-h-[340px] sm:min-h-[380px] lg:min-h-[480px] xl:min-h-[520px] overflow-visible"
            onMouseEnter={() => setHoveredStack("left")}
            onMouseLeave={() => setHoveredStack(null)}
          >
            <AnimatePresence mode="sync">
              {isLayoutA ? (
                <motion.div
                  key="layout-a-left"
                  className="absolute inset-0 flex flex-col gap-4 lg:gap-5 items-center lg:items-end justify-center lg:justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div
                    className="relative flex justify-center lg:justify-end min-h-[280px] lg:min-h-[320px] w-full py-5"
                    onMouseEnter={() => setHoveredStack("left")}
                    onMouseLeave={() => setHoveredStack(null)}
                  >
                    <EventFrame key={`left-behind-${selectedSlug}`} src={img3} alt={selectedCategory?.title || ""} rotationDeg={-12} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} absolute -left-6 -top-4`} behind revealOnHover isHovered={hoveredStack === "left"} slideDirection="left" />
                    <EventFrame key={`left-${selectedSlug}`} src={img0} alt={selectedCategory?.title || ""} rotationDeg={10} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} relative z-10`} />
                  </div>
                  <motion.div
                    key={`text-${selectedSlug}`}
                    className="text-center lg:text-right max-w-sm lg:max-w-none"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                  >
                    <p className="text-muted-foreground dark:text-ivory/90 text-sm sm:text-base leading-relaxed">
                      {selectedCategory?.description || ""}
                    </p>
                    {selectedCategory?.powered_by && (
                      <div className="mt-4">
                        <p className="text-muted-foreground/80 dark:text-ivory/50 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-2">Powered By</p>
                        <span className="text-foreground dark:text-ivory/70 text-sm font-medium">{selectedCategory.powered_by}</span>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="layout-b-left"
                  className="absolute inset-0 flex flex-col items-center lg:items-end justify-center lg:justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div
                    className="relative flex flex-col items-center lg:items-end gap-4 min-h-[280px] lg:min-h-[320px] w-full py-5"
                    onMouseEnter={() => setHoveredStack("left")}
                    onMouseLeave={() => setHoveredStack(null)}
                  >
                    <EventFrame key={`left-behind-${selectedSlug}`} src={img3} alt={selectedCategory?.title || ""} rotationDeg={-8} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} absolute -right-4 -bottom-6`} behind revealOnHover isHovered={hoveredStack === "left"} slideDirection="right" />
                    <EventFrame key={`left-a-${selectedSlug}`} src={img0} alt={selectedCategory?.title || ""} rotationDeg={-12} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} relative z-10`} />
                    <EventFrame key={`left-b-${selectedSlug}`} src={img1} alt={selectedCategory?.title || ""} rotationDeg={11} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} relative z-10`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Categories */}
          <div className="lg:col-span-4 order-1 lg:order-2 flex flex-col items-center justify-center py-4 lg:py-0 lg:min-h-[480px] xl:min-h-[520px]">
            <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
              {displayCategories.map((cat) => {
                const isActive = cat.slug === selectedSlug;
                return (
                  <div
                    key={cat.slug}
                    onMouseEnter={() => setSelectedSlug(cat.slug)}
                    onClick={() => setSelectedSlug(cat.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedSlug(cat.slug)}
                    className="text-center cursor-pointer"
                  >
                    <span
                      className={`block text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight transition-all duration-300 ease-out
                        ${isActive ? "text-foreground dark:text-ivory border-b-2 border-primary dark:border-ivory pb-2" : "text-muted-foreground dark:text-ivory/70 hover:text-foreground dark:hover:text-ivory"}`}
                    >
                      {cat.title.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column - fixed height container to prevent layout shift */}
          <div
            data-debug-events-right
            className="lg:col-span-4 order-3 relative min-h-[340px] sm:min-h-[380px] lg:min-h-[480px] xl:min-h-[520px] overflow-visible"
            onMouseEnter={() => setHoveredStack("right")}
            onMouseLeave={() => setHoveredStack(null)}
          >
            <AnimatePresence mode="sync">
              {isLayoutA ? (
                <motion.div
                  key="layout-a-right"
                  className="absolute inset-0 flex flex-col items-center lg:items-start justify-center lg:justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div
                    className="relative flex flex-col items-center lg:items-start pt-5 min-h-[280px] lg:min-h-[320px] w-full py-5"
                    onMouseEnter={() => setHoveredStack("right")}
                    onMouseLeave={() => setHoveredStack(null)}
                  >
                    <EventFrame key={`right-behind-${selectedSlug}`} src={img4} alt={selectedCategory?.title || ""} rotationDeg={5} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} absolute -right-4 bottom-0`} behind revealOnHover isHovered={hoveredStack === "right"} slideDirection="right" />
                    <EventFrame key={`right-b-${selectedSlug}`} src={img2} alt={selectedCategory?.title || ""} rotationDeg={12} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} relative z-10`} />
                    <EventFrame key={`right-a-${selectedSlug}`} src={img1} alt={selectedCategory?.title || ""} rotationDeg={-10} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} relative z-20 -mt-4`} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="layout-b-right"
                  className="absolute inset-0 flex flex-col gap-4 lg:gap-5 items-center lg:items-start justify-center lg:justify-center w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div
                    className="relative flex justify-center lg:justify-start min-h-[280px] lg:min-h-[320px] w-full py-5"
                    onMouseEnter={() => setHoveredStack("right")}
                    onMouseLeave={() => setHoveredStack(null)}
                  >
                    <EventFrame key={`right-behind-${selectedSlug}`} src={img4} alt={selectedCategory?.title || ""} rotationDeg={8} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} absolute -left-6 -top-4`} behind revealOnHover isHovered={hoveredStack === "right"} slideDirection="left" />
                    <EventFrame key={`right-${selectedSlug}`} src={img2} alt={selectedCategory?.title || ""} rotationDeg={-11} slug={selectedSlug} frameId={frameId} className={`${polaroidSize} relative z-10`} />
                  </div>
                  <motion.div
                    key={`text-r-${selectedSlug}`}
                    className="text-center lg:text-left max-w-sm lg:max-w-none"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                  >
                    <p className="text-muted-foreground dark:text-ivory/90 text-sm sm:text-base leading-relaxed">
                      {selectedCategory?.description || ""}
                    </p>
                    {selectedCategory?.powered_by && (
                      <div className="mt-4">
                        <p className="text-muted-foreground/80 dark:text-ivory/50 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-2">Powered By</p>
                        <span className="text-foreground dark:text-ivory/70 text-sm font-medium">{selectedCategory.powered_by}</span>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-center mt-10">
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
