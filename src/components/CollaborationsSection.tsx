import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { resolvePublicStorageUrl } from "@/services/storage";
import { shortLocationForCard } from "@/lib/addressUtils";
import { getActiveCollaborations, type Collaboration } from "@/services/collaborations";
import { useLeadCaptureOptional } from "@/contexts/LeadCaptureContext";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import PartnersVenueShowcase from "@/components/ui/partners-venue-showcase";
import type { PartnerVenueCardData } from "@/components/ui/partner-venue-card";
import { VENUES_LIST_PATH } from "@/lib/venueRoutes";

function resolveLogoUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  return resolvePublicStorageUrl(url, "partner-logos");
}

type CollaborationsSectionProps = {
  prefetchedCollaborations?: Collaboration[];
  homepageDataPending?: boolean;
};

const CollaborationsSection = ({ prefetchedCollaborations, homepageDataPending }: CollaborationsSectionProps = {}) => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const leadCapture = useLeadCaptureOptional();
  const selectedVenue = leadCapture?.selectedVenue ?? null;

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedCollaborations !== undefined) {
      setCollaborations(prefetchedCollaborations);
      return;
    }

    getActiveCollaborations()
      .then(setCollaborations)
      .catch((err) => {
        console.error("Failed to fetch collaborations:", err);
      });
  }, [homepageDataPending, prefetchedCollaborations]);

  const displayed = useMemo(() => {
    if (!selectedVenue || selectedVenue.trim() === "") return collaborations;
    const v = selectedVenue.trim().toLowerCase();
    return collaborations.filter((c) => (c.name || "").trim().toLowerCase() === v);
  }, [collaborations, selectedVenue]);

  const venueCards = useMemo<PartnerVenueCardData[]>(
    () =>
      displayed.map((venue) => ({
        id: venue.id,
        name: venue.name,
        location: shortLocationForCard(venue.location),
        logoUrl: resolveLogoUrl(venue.logo_url),
        bannerUrl: venue.banner_url,
      })),
    [displayed],
  );

  if (collaborations.length === 0) return null;
  if (displayed.length === 0) return null;

  return (
    <HomeSectionShell
      ariaLabelledBy="partners-heading"
      badge="Our Partners"
      title={<HomeSectionSplitTitle line1="Trusted By" accent="Elegant Venues" />}
      subtitle="Premium venues we partner with for seamless, elevated celebrations."
      variant="linen"
      fullBleed
      contentClassName="pt-0"
      action={
        <div className="flex justify-end">
          <Link
            to={VENUES_LIST_PATH}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            View all venues
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <PartnersVenueShowcase venues={venueCards} edgeToEdge />
    </HomeSectionShell>
  );
};

export default CollaborationsSection;
