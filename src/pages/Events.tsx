import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CountUp from "@/components/CountUp";
import { SEO } from "@/components/SEO";
import { getActiveEvents, Event, getEventSteps } from "@/services/events";
import { HeroBackgroundPattern } from "@/components/ui/HeroBackgroundPattern";
import { getAlbumsByEventId } from "@/services/albums";
import { getPageHeroContent } from "@/services/pageHeroContent";

// Fallback images by slug when event has no cover_image
const SLUG_TO_IMAGE: Record<string, string> = {
  wedding: "/wedding 1.jpg",
  birthday: "/birthday.jpg",
  engagement: "/engagement.jpg",
  sangeet: "/sangeet.jpg",
  haldi: "/haldi.jpg",
  mehendi: "/mehendi.jpg",
  anniversary: "/anniversary.jpg",
  corporate: "/corporate.jpg",
  "corporate-events": "/corporate.jpg",
  "car-opening": "/corporate.jpg",
};

function getEventImage(event: Event): string {
  if (event.cover_image) return event.cover_image;
  const key = event.slug.toLowerCase().replace(/\s+/g, "-");
  return SLUG_TO_IMAGE[key] || "/placeholder.svg";
}

const Events = () => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventAlbumsCount, setEventAlbumsCount] = useState<Record<string, number>>({});
  const [eventStepsCount, setEventStepsCount] = useState<Record<string, number>>({});
  const [heroContent, setHeroContent] = useState<Awaited<ReturnType<typeof getPageHeroContent>> | null>(null);
  const [isDark, setIsDark] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    loadEvents();
    getPageHeroContent("events").then(setHeroContent).catch(() => setHeroContent(null));
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

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const activeEvents = await getActiveEvents();
      setEvents(activeEvents);

      const albumsCounts: Record<string, number> = {};
      const stepsCounts: Record<string, number> = {};

      await Promise.all(
        activeEvents.map(async (event) => {
          try {
            const albums = await getAlbumsByEventId(event.id);
            albumsCounts[event.id] = albums.length;
            const steps = await getEventSteps(event.id);
            stepsCounts[event.id] = steps.length;
          } catch {
            albumsCounts[event.id] = 0;
            stepsCounts[event.id] = 0;
          }
        })
      );

      setEventAlbumsCount(albumsCounts);
      setEventStepsCount(stepsCounts);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const totalEvents = events.length;
  const totalAlbums = Object.values(eventAlbumsCount).reduce((a, b) => a + b, 0);
  const happyClients = totalAlbums * 50;

  const stats = [
    { label: "Event Types", value: 8, suffix: "+" },
    { label: "Events Completed", value: 2200, suffix: "+" },
    { label: "Happy Clients", value: 2000, suffix: "+" },
  ];

  const isStatFromHero = heroContent?.stats && heroContent.stats.length >= 3;

  return (
    <>
      <SEO
        title="Events"
        description="Explore our premium event planning services including weddings, birthdays, corporate events, and celebrations in Pune, Maharashtra."
        keywords="event planning Pune, wedding planning, birthday parties, corporate events Maharashtra, event management"
        url="/events"
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section - elegant abstract gradient mesh */}
        <section
          className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
          aria-label="Events hero"
        >
          {/* Abstract gradient mesh background */}
          <div className="absolute inset-0 events-page-mesh-bg" aria-hidden />
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
          <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="typography-eyebrow inline-block text-primary mb-4 tracking-label-wide"
            >
              {heroContent?.title || "Our Events"}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground"
            >
              Choose Your <span className="text-gradient-gold">Celebration</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="typography-body-lg max-w-3xl mx-auto text-muted-foreground"
            >
              {heroContent?.description ||
                "Click on any event type to explore our process and see how we make magic happen"}
            </motion.p>
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

        {/* Stats Section - overlap hero, 3 columns, count-up */}
        <section
          className="relative z-20 -mt-[40px] max-w-[900px] mx-auto px-4 sm:px-6"
          aria-label="Statistics"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="bg-card/90 dark:bg-card/95 backdrop-blur-xl rounded-2xl
                     shadow-[0_8px_32px_rgba(26,26,46,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                     border border-border/80 dark:border-white/10
                     flex flex-row divide-x divide-border
                     hover:border-primary/20 dark:hover:border-primary/30 transition-colors duration-300"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-center py-2 sm:py-6 px-1 sm:px-4"
              >
                <span className="text-sm sm:text-2xl md:text-3xl font-serif font-semibold text-primary mb-0 sm:mb-1">
                  {isStatFromHero ? (
                    stat.value
                  ) : (
                    <CountUp
                      end={typeof stat.value === "number" ? stat.value : parseInt(String(stat.value), 10) || 0}
                      duration={2000}
                      suffix={stat.suffix || ""}
                      reducedMotion={!!prefersReducedMotion}
                    />
                  )}
                </span>
                <span className="text-[10px] sm:text-sm text-center text-muted-foreground leading-tight">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Section Heading - Choose Your Celebration - REMOVED as it is now in Hero */}
        <section className="py-8 sm:py-12 lg:py-16 bg-background">

          {/* Event Cards - Option A Interactive Hover */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No events available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5">
                {events.map((event, index) => {
                  const albumCount = eventAlbumsCount[event.id] || 0;
                  const stepsCount = eventStepsCount[event.id] || 0;
                  const isHovered = hoveredEvent === event.id;
                  const imageSrc = getEventImage(event);
                  const photoLabel =
                    albumCount > 0 ? `${albumCount}+ Photos` : "View Gallery";

                  return (
                    <motion.article
                      key={event.id}
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : index * 0.08,
                        duration: 0.45,
                      }}
                      onMouseEnter={() => setHoveredEvent(event.id)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      className="group"
                    >
                      <Link
                        to={`/events/${event.slug}`}
                        className="events-premium-card block relative w-full rounded-[22px] overflow-hidden
                                 cursor-pointer transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                                 shadow-lg border border-transparent dark:border-white/10
                                 hover:shadow-[0_24px_56px_rgba(26,26,46,0.12)] dark:hover:shadow-[0_24px_56px_rgba(0,0,0,0.4)]
                                 hover:-translate-y-2 hover:ring-2 hover:ring-primary/20 dark:hover:border-primary/40
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        style={{
                          aspectRatio: "3/4",
                          willChange: isHovered ? "transform" : undefined,
                        }}
                        aria-label={`Explore ${event.title}`}
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <img
                            src={imageSrc}
                            alt={event.title}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-[600ms] ease-out
                                    ${isHovered ? "brightness-100 scale-105" : "brightness-[0.88] scale-100"}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                            loading="lazy"
                          />
                          <div
                            className={`absolute inset-0 transition-all duration-400
                                    ${isHovered
                                ? "bg-gradient-to-t from-black/65 via-black/25 to-black/20"
                                : "bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                              }`}
                          />
                        </div>

                        {/* Step badge – top right */}
                        {stepsCount > 0 && (
                          <div
                            className="hidden sm:block absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full
                                    bg-primary text-primary-foreground text-[10px] font-medium uppercase tracking-wide shadow-lg"
                          >
                            {stepsCount} Step Process
                          </div>
                        )}

                        {/* Content – bottom */}
                        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-5 z-10 w-full text-center sm:text-left">
                          <h3
                            className="font-serif font-semibold text-white text-[10px] leading-tight sm:text-xl mb-0 sm:mb-2 tracking-tight line-clamp-2"
                            style={{
                              textShadow: "0 2px 16px rgba(0,0,0,0.6)",
                            }}
                          >
                            {event.title}
                          </h3>
                          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                  bg-charcoal/25 border border-white/25
                                  text-white text-xs font-medium">
                            <Camera className="w-3.5 h-3.5 text-primary shrink-0" />
                            {photoLabel}
                          </div>
                          <motion.div
                            initial={false}
                            animate={{
                              opacity: isHovered ? 1 : 0,
                              y: isHovered ? 0 : 6,
                            }}
                            transition={{ duration: 0.25, delay: 0.05 }}
                            className="mt-2 hidden sm:inline-flex items-center gap-1.5 text-primary text-xs font-semibold"
                          >
                            <span>View More</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </motion.div>
                        </div>
                      </Link>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section – card-style like collaborations */}
        <section className="py-12 sm:py-16 lg:py-20 bg-background" aria-label="Plan your event">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(232,175,193,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] py-10 sm:py-12 px-6 sm:px-8"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold mb-3 sm:mb-4 text-foreground">
                Don&apos;t See Your Event? Let&apos;s Talk!
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8">
                We specialize in creating custom experiences for any occasion. Share your vision with us.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 hover:shadow-lg transition-all"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-4 sm:mt-5 text-sm text-muted-foreground">
                Call us or send a message—we&apos;d love to hear from you
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Events;
