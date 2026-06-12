import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import VenuesPageHero from "@/components/VenuesPageHero";
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
  const [heroContent, setHeroContent] = useState<Awaited<ReturnType<typeof getPageHeroContent>> | null>(null);

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

  const venueCards: PartnerVenueCardData[] = useMemo(
    () =>
      venues.map((collab) => ({
        id: collab.id,
        name: collab.name,
        location: shortLocationForCard(collab.location),
        logoUrl: collab.logo_url
          ? resolvePublicStorageUrl(collab.logo_url, "partner-logos")
          : "/placeholder.svg",
        bannerUrl: collab.banner_url,
      })),
    [venues],
  );

  const heroDescription =
    heroContent?.description ||
    "Discover our curated network of premium venues across Pune — perfect for weddings, corporate gatherings, and milestone celebrations.";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partner Venues in Pune"
        description="Explore premium partner venues in Pune for weddings, corporate events, and celebrations. Book through Phoenix Events & Production."
        keywords="wedding venues Pune, event venues Maharashtra, partner venues, banquet halls Pune"
        url={VENUES_LIST_PATH}
      />
      <Navbar />

      <VenuesPageHero
        eyebrow="Partner venues"
        description={heroDescription}
        venueCount={venueCards.length}
      />

      <section className="pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : venueCards.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card px-6 py-14 text-center">
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
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {venueCards.map((venue, index) => (
                <PartnerVenueCard key={venue.id} venue={venue} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
}
