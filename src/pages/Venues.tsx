import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { HeroBackgroundPattern } from "@/components/ui/HeroBackgroundPattern";
import { getActiveCollaborations } from "@/services/collaborations";
import { getPageHeroContent } from "@/services/pageHeroContent";
import { SEO } from "@/components/SEO";
import { shortLocationForCard } from "@/lib/addressUtils";
import { resolvePublicStorageUrl } from "@/services/storage";
import { PartnerVenueCard, type PartnerVenueCardData } from "@/components/ui/partner-venue-card";
import { VENUES_LIST_PATH } from "@/lib/venueRoutes";

export default function Venues() {
  const [venues, setVenues] = useState<Awaited<ReturnType<typeof getActiveCollaborations>>>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [heroContent, setHeroContent] = useState<Awaited<ReturnType<typeof getPageHeroContent>> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    Promise.all([
      getActiveCollaborations(),
      getPageHeroContent("collaborations").catch(() => null),
    ])
      .then(([collabs, hero]) => {
        setVenues(collabs);
        setHeroContent(hero);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
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

  const venueCards: PartnerVenueCardData[] = venues.map((collab) => ({
    id: collab.id,
    name: collab.name,
    location: shortLocationForCard(collab.location),
    logoUrl: collab.logo_url
      ? resolvePublicStorageUrl(collab.logo_url, "partner-logos")
      : "/placeholder.svg",
    bannerUrl: collab.banner_url,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partner Venues in Pune"
        description="Explore premium partner venues in Pune for weddings, corporate events, and celebrations. Book through Phoenix Events & Production."
        keywords="wedding venues Pune, event venues Maharashtra, partner venues, banquet halls Pune"
        url={VENUES_LIST_PATH}
      />
      <Navbar />

      <section className="relative flex min-h-[40vh] items-center justify-center overflow-hidden pt-20 pb-8 sm:pt-24 sm:pb-10">
        <div className="absolute inset-0 collaborations-page-mesh-bg" aria-hidden />
        <HeroBackgroundPattern />
        {!prefersReducedMotion && (
          <>
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-40" : "opacity-70"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 25% 35%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 65% 25%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                      "radial-gradient(circle at 25% 35%, rgba(20, 30, 60, 0.4) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 105% 115% at 60% 60%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                    ],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </>
        )}

        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="typography-hero mb-6 text-foreground">
              {heroContent?.subtitle ? (
                (() => {
                  const words = heroContent.subtitle.split(" ");
                  const lastWord = words[words.length - 1];
                  const restWords = words.slice(0, -1).join(" ");
                  return (
                    <>
                      {restWords}
                      {restWords && " "}
                      <span className="text-gradient-gold">{lastWord}</span>
                    </>
                  );
                })()
              ) : (
                <>
                  Elegant <span className="text-gradient-gold">Venues</span>
                </>
              )}
            </h1>
            <p className="typography-body-lg mx-auto max-w-2xl text-muted-foreground">
              {heroContent?.description ||
                "Discover our curated network of premium venues across Pune — perfect for weddings, corporate gatherings, and milestone celebrations."}
            </p>
          </motion.div>
        </div>

        <div
          className="hero-merge-gradient pointer-events-none absolute bottom-0 left-0 right-0 z-[1]"
          style={{ height: "clamp(180px, 28vh, 280px)" }}
          aria-hidden
        />
      </section>

      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center sm:mb-10"
          >
            <h2 className="typography-section mb-4">
              All <span className="text-gradient-gold">Venues</span>
            </h2>
            <p className="typography-body-lg mx-auto max-w-2xl text-muted-foreground">
              Tap a venue to explore photos, videos, and venue details
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : venueCards.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card/80 px-6 py-12 text-center">
              <MapPin className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
              <h3 className="mb-2 font-serif text-xl font-semibold">Venues coming soon</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                We&apos;re adding partner venues. Contact us to plan your event in the meantime.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Get in touch
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {venueCards.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                >
                  <PartnerVenueCard venue={venue} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[0_8px_32px_rgba(232,175,193,0.12)] sm:px-8 sm:py-12 dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground sm:mb-4 sm:text-3xl md:text-4xl">
              Plan Your Event <span className="text-gradient-gold">With Us</span>
            </h2>
            <p className="mb-6 text-sm text-muted-foreground sm:mb-8 sm:text-base">
              Need help choosing a venue? Our team will match you with the perfect space for your celebration.
            </p>
            <Link
              to="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:px-8 sm:py-4"
            >
              Enquire Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
