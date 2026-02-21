import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HeroBackgroundPattern } from "@/components/ui/HeroBackgroundPattern";
import { Link } from "react-router-dom";
import {
  Camera,
  ArrowRight,
  Sparkles,
  Loader2,
  Calendar,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SEO } from "@/components/SEO";
import { getActiveEvents } from "@/services/events";
import { getAllAlbums, getAlbumMedia } from "@/services/albums";
import type { Event } from "@/services/events";
import type { Album } from "@/services/albums";
import { getPageHeroContent } from "@/services/pageHeroContent";
import { getEventIcon } from "@/lib/eventIcons";

interface AlbumWithCount extends Album {
  mediaCount?: number;
  eventTitle?: string;
}

interface EventTypeOption {
  id: string | null;
  slug: string;
  title: string;
  photoCount: number;
  albumCount: number;
}

const Gallery = () => {
  const [hoveredCircle, setHoveredCircle] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [albums, setAlbums] = useState<AlbumWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [heroContent, setHeroContent] = useState<
    Awaited<ReturnType<typeof getPageHeroContent>> | null
  >(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    loadData();
    getPageHeroContent("gallery").then(setHeroContent).catch(() => setHeroContent(null));
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, albumsData] = await Promise.all([
        getActiveEvents(),
        getAllAlbums(),
      ]);

      setEvents(eventsData);

      const albumsWithCounts = await Promise.all(
        (albumsData as any[]).map(async (album: any) => {
          try {
            const media = await getAlbumMedia(album.id);
            const event = eventsData.find((e) => e.id === album.event_id);
            return {
              ...album,
              mediaCount: media.length,
              eventTitle: event?.title ?? "Unknown Event",
            };
          } catch {
            const event = eventsData.find((e) => e.id === album.event_id);
            return {
              ...album,
              mediaCount: 0,
              eventTitle: event?.title ?? "Unknown Event",
            };
          }
        })
      );

      setAlbums(albumsWithCounts);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const totalPhotos = albums.reduce((acc, a) => acc + (a.mediaCount ?? 0), 0);
  const totalAlbums = albums.length;

  const eventTypesForCircles: EventTypeOption[] = events.map((event) => {
    const evAlbums = albums.filter((a) => a.event_id === event.id);
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      photoCount: evAlbums.reduce((acc, a) => acc + (a.mediaCount ?? 0), 0),
      albumCount: evAlbums.length,
    };
  });

  const filteredAlbums =
    selectedEventId === null
      ? albums
      : albums.filter((a) => a.event_id === selectedEventId);

  const featuredAlbums = albums.filter((a) => a.is_featured);
  const displayAlbums =
    selectedEventId === null
      ? (featuredAlbums.length > 0 ? featuredAlbums.slice(0, 6) : albums.slice(0, 6))
      : filteredAlbums;

  const stats =
    heroContent?.stats && heroContent.stats.length >= 3
      ? heroContent.stats.slice(0, 3)
      : [
        { value: `${totalPhotos}+`, label: "Photos" },
        { value: String(totalAlbums), label: "Albums" },
        { value: String(events.length), label: "Event Types" },
      ];

  const heroSubtitle = heroContent?.subtitle ?? "Moments We've Captured";
  const heroSubtitleLastSpace = heroSubtitle.lastIndexOf(" ");
  const heroSubtitleFirst =
    heroSubtitleLastSpace >= 0 ? heroSubtitle.slice(0, heroSubtitleLastSpace + 1) : "";
  const heroSubtitleGold =
    heroSubtitleLastSpace >= 0 ? heroSubtitle.slice(heroSubtitleLastSpace + 1) : heroSubtitle;

  return (
    <>
      <SEO
        title="Gallery"
        description="Browse our stunning event photography gallery showcasing weddings, birthdays, corporate events, and celebrations in Pune, Maharashtra."
        keywords="event photography Pune, wedding photos, event gallery, party photography Maharashtra, celebration photos"
        url="/gallery"
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section - Reduced height for compact layout */}
        <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden min-h-[45vh] flex items-center justify-center">
          {/* Abstract gradient mesh background */}
          <div className="absolute inset-0 gallery-page-mesh-bg" aria-hidden />
          {/* Subtle animated radial dot pattern - theme aware */}
          <HeroBackgroundPattern />
          {!prefersReducedMotion && (
            <>
              {/* Purple gradient mesh for light theme - smooth elegant movement */}
              <motion.div
                className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-40" : "opacity-70"}`}
                aria-hidden
                animate={{
                  background: isDark
                    ? [
                      "radial-gradient(circle at 25% 35%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 65% 25%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 75% 55%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 45% 75%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 60%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 25% 35%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                    ]
                    : [
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 115% 105% at 30% 35%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 105% 115% at 60% 60%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 100% 120% at 90% 80%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 110% 110% at 70% 50%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 115% 105% at 40% 25%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                    ],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* Indigo blue layer */}
              <motion.div
                className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-30" : "opacity-65"}`}
                aria-hidden
                animate={{
                  background: isDark
                    ? [
                      "radial-gradient(circle at 70% 25%, rgba(232, 175, 193, 0.08) 0%, transparent 50%)",
                      "radial-gradient(circle at 35% 70%, rgba(232, 175, 193, 0.08) 0%, transparent 50%)",
                      "radial-gradient(circle at 15% 45%, rgba(232, 175, 193, 0.08) 0%, transparent 50%)",
                      "radial-gradient(circle at 55% 15%, rgba(232, 175, 193, 0.08) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 65%, rgba(232, 175, 193, 0.08) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 25%, rgba(232, 175, 193, 0.08) 0%, transparent 50%)",
                    ]
                    : [
                      "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 115% 120% at 60% 30%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 130% 100% at 20% 85%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 120% 115% at 45% 70%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 110% 120% at 55% 45%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 105% 125% at 75% 20%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                    ],
                }}
                transition={{ duration: 24, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 3 }}
              />
              {/* Purple layer */}
              <motion.div
                className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-20" : "opacity-60"}`}
                aria-hidden
                animate={{
                  background: isDark
                    ? [
                      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
                      "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
                      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
                    ]
                    : [
                      "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 125% 115% at 50% 50%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 110% 130% at 65% 35%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 120% 120% at 85% 85%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 115% 125% at 25% 40%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 125% 115% at 70% 75%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                    ],
                }}
                transition={{ duration: 28, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 6 }}
              />
              {/* Cyan/blue accent for light theme - smooth elegant movement */}
              {!isDark && (
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-50"
                  aria-hidden
                  animate={{
                    background: [
                      "radial-gradient(ellipse 100% 120% at 25% 10%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                      "radial-gradient(ellipse 110% 115% at 40% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                      "radial-gradient(ellipse 120% 100% at 75% 90%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                      "radial-gradient(ellipse 115% 105% at 60% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                      "radial-gradient(ellipse 110% 110% at 45% 55%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                      "radial-gradient(ellipse 105% 115% at 30% 30%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                      "radial-gradient(ellipse 100% 120% at 25% 10%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    ],
                  }}
                  transition={{ duration: 22, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 1.5 }}
                />
              )}
              {/* Gold accent for light theme - smooth elegant movement */}
              {!isDark && (
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-35"
                  aria-hidden
                  animate={{
                    background: [
                      "radial-gradient(ellipse 90% 100% at 5% 45%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                      "radial-gradient(ellipse 95% 105% at 25% 35%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                      "radial-gradient(ellipse 100% 90% at 95% 55%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                      "radial-gradient(ellipse 105% 95% at 70% 70%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                      "radial-gradient(ellipse 110% 110% at 50% 5%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                      "radial-gradient(ellipse 100% 100% at 15% 60%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                      "radial-gradient(ellipse 90% 100% at 5% 45%, hsl(var(--primary) / 0.18) 0%, transparent 55%)",
                    ],
                  }}
                  transition={{ duration: 26, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 4 }}
                />
              )}
            </>
          )}

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="typography-eyebrow inline-block text-primary mb-4"
              >
                Our Portfolio
              </motion.span>
              <h1 className="typography-hero mb-6 text-foreground">
                Browse by <span className="text-gradient-gold">Event Type</span>
              </h1>
              <p className="typography-body-lg max-w-2xl mx-auto text-muted-foreground">
                Select an event category to explore our curated albums. Click again to deselect.
              </p>
            </motion.div>
          </div>
          {/* Smooth merge: hero fades gently into background (theme-aware) */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1] hero-merge-gradient"
            style={{
              height: "clamp(180px, 28vh, 280px)",
            }}
            aria-hidden
          />
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Browse by Event Type - Circular selector */}
            <section className="pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 -mt-8 relative z-10">
              <div className="max-w-[1200px] mx-auto">

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-8 sm:gap-10 justify-items-center">
                  {eventTypesForCircles.map((option, index) => {
                    const isSelected = option.id === selectedEventId;
                    const isHovered = hoveredCircle === option.slug;
                    const event = option.id ? events.find((e) => e.id === option.id) : null;
                    const eventImage = event?.cover_image;
                    const IconComponent = getEventIcon(option.slug);

                    return (
                      <motion.button
                        key={option.slug}
                        type="button"
                        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        whileInView={
                          prefersReducedMotion ? {} : { opacity: 1, scale: 1 }
                        }
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.08,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        onMouseEnter={() => setHoveredCircle(option.slug)}
                        onMouseLeave={() => setHoveredCircle(null)}
                        onClick={() => {
                          // Toggle: if already selected, deselect (set to null), otherwise select
                          setSelectedEventId(option.id === selectedEventId ? null : option.id);
                        }}
                        className="flex flex-col items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
                        aria-label={`Filter by ${option.title}`}
                        aria-pressed={isSelected}
                      >
                        <motion.div
                          className={`
                          relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px]
                          rounded-full overflow-hidden cursor-pointer
                          transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
                          ${isSelected
                              ? "border-2 border-primary shadow-[0_8px_32px_hsl(var(--primary)_/_0.28)] ring-2 ring-primary/20"
                              : "border-2 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                            }
                          ${isHovered && !isSelected ? "border-primary shadow-[0_12px_40px_hsl(var(--primary)_/_0.22)] -translate-y-2 scale-105" : ""}
                        `}
                          whileTap={{ scale: 0.98 }}
                        >
                          {eventImage ? (
                            <>
                              <img
                                src={eventImage}
                                alt={option.title}
                                className={`w-full h-full object-cover transition-all duration-500 ${isSelected || isHovered
                                  ? "scale-110"
                                  : "scale-100"
                                  }`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                  const fallback = (e.target as HTMLElement).parentElement?.querySelector(".icon-fallback");
                                  if (fallback) (fallback as HTMLElement).style.display = "flex";
                                }}
                              />
                              <div
                                className={`absolute inset-0 transition-all duration-300 ${isSelected
                                  ? "bg-primary/20 backdrop-blur-[1px]"
                                  : "bg-transparent"
                                  }`}
                              />
                              <div
                                className="icon-fallback hidden absolute inset-0 items-center justify-center bg-white/5 backdrop-blur-[10px]"
                                style={{ display: "none" }}
                              >
                                <IconComponent
                                  className={`w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14 transition-colors duration-300 ${isSelected || isHovered ? "text-primary" : "text-white"
                                    }`}
                                  aria-hidden
                                />
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-[10px] flex items-center justify-center">
                              <IconComponent
                                className={`w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14 transition-colors duration-300 ${isSelected || isHovered ? "text-primary" : "text-white"
                                  }`}
                                aria-hidden
                              />
                            </div>
                          )}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-3.5 h-3.5 text-[#1A1A2E]" strokeWidth={3} />
                            </motion.div>
                          )}
                          {(isHovered || isSelected) && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-primary text-[#1A1A2E] text-[10px] font-semibold border-2 border-background shadow-lg"
                            >
                              {option.photoCount}+
                            </motion.span>
                          )}
                        </motion.div>
                        <span
                          className={`text-sm font-medium text-center transition-colors duration-300 max-w-[100px] sm:max-w-[120px] ${isSelected || isHovered ? "text-primary" : "text-foreground/90"
                            }`}
                        >
                          {option.title}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Featured / Filtered Albums - Premium cards */}
            <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
              <div className="max-w-[1400px] mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
                >
                  <div>
                    <h2 className="typography-section mb-2">
                      {selectedEventId === null ? (
                        <>
                          Featured <span className="text-primary">Albums</span>
                        </>
                      ) : (
                        <>
                          <span className="text-primary">
                            {events.find((e) => e.id === selectedEventId)?.title ?? "Albums"}
                          </span>{" "}
                          Albums
                        </>
                      )}
                    </h2>
                    <p className="typography-body-lg text-muted-foreground">
                      {selectedEventId === null
                        ? "Our most loved event collections"
                        : `${filteredAlbums.length} album${filteredAlbums.length !== 1 ? "s" : ""} in this category`}
                    </p>
                  </div>
                  <Link
                    to="/gallery/all"
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm sm:text-base"
                  >
                    View All Albums <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                {displayAlbums.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No albums found in this category</p>
                    <p className="text-sm text-muted-foreground">Try selecting a different event type</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                    <AnimatePresence mode="wait">
                      {displayAlbums.map((album, index) => {
                        const event = events.find((e) => e.id === album.event_id);
                        const slug = event?.slug ?? "all";

                        return (
                          <motion.article
                            key={album.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{
                              duration: 0.4,
                              delay: prefersReducedMotion ? 0 : index * 0.08,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                            className="group"
                          >
                            <Link
                              to={`/gallery/${slug}/${album.id}`}
                              className="group/album block relative h-full rounded-[20px] overflow-hidden
                              bg-card border border-border/60 dark:border-white/10
                              shadow-[0_4px_24px_rgba(26,26,46,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                              transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
                              hover:shadow-[0_24px_56px_rgba(26,26,46,0.12)] dark:hover:shadow-[0_24px_56px_rgba(0,0,0,0.4)]
                              hover:-translate-y-2 hover:border-primary/20 dark:hover:border-primary/40
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                              <div className="relative aspect-[3/4] flex flex-col">
                                {/* Image section */}
                                <div className="relative h-[62%] overflow-hidden bg-muted/50">
                                  <img
                                    src={album.cover_image ?? "/placeholder.svg"}
                                    alt={album.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover/album:scale-105 brightness-[0.92] group-hover/album:brightness-100"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                  />
                                  <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-background via-background/30 to-transparent" />

                                  {album.is_featured && (
                                    <div className="hidden sm:flex absolute top-5 left-5 items-center gap-2 px-4 py-2 rounded-full bg-primary/95 backdrop-blur-sm text-primary-foreground text-[11px] font-semibold uppercase tracking-widest shadow-[0_4px_14px_hsl(var(--primary)_/_0.35)]">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Featured
                                    </div>
                                  )}

                                  <div className="hidden sm:flex absolute bottom-5 right-5 items-center gap-2 px-3.5 py-2 rounded-full bg-background/95 dark:bg-[#1A1A2E]/95 backdrop-blur-md border border-border/60 text-foreground dark:text-white text-[13px] font-medium">
                                    <Camera className="w-3.5 h-3.5 text-primary" />
                                    {album.mediaCount ?? 0} photos
                                  </div>
                                </div>

                                {/* Content section */}
                                <div className="relative flex flex-col justify-between flex-1 min-h-0 p-3 sm:p-6 bg-card">
                                  <div>
                                    <span className="inline-block text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-primary mb-1.5 sm:mb-2 leading-none">
                                      {album.eventTitle}
                                    </span>
                                    <h3 className="font-serif text-sm sm:text-xl font-bold text-foreground mb-1 sm:mb-2 line-clamp-2 leading-tight tracking-tight
                                                  group-hover/album:text-primary transition-colors duration-300">
                                      {album.title}
                                    </h3>
                                    {album.event_date && (
                                      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                        {new Date(album.event_date).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <span className="hidden sm:inline-flex mt-4 items-center gap-2 w-fit px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold
                                    opacity-0 translate-y-1 group-hover/album:opacity-100 group-hover/album:translate-y-0 transition-all duration-300 ease-out
                                    shadow-[0_4px_14px_hsl(var(--primary)_/_0.3)] group-hover/album:shadow-[0_6px_20px_hsl(var(--primary)_/_0.4)]">
                                    View Album <ArrowRight className="w-4 h-4" />
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {displayAlbums.length > 0 && (
                  <div className="mt-10 text-center sm:hidden">
                    <Link
                      to="/gallery/all"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium"
                    >
                      View All Albums <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* CTA Section – card-style like collaborations */}
        <section className="py-12 sm:py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(232,175,193,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] py-10 sm:py-12 px-6 sm:px-8"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4 text-foreground">
                Ready to Create Your Own <span className="text-primary">Story?</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                Let us help you create moments that you&apos;ll cherish forever.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 hover:shadow-lg transition-all"
              >
                Book Your Event
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Gallery;
