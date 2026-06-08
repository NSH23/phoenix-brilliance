import { useEffect, useMemo, useState } from "react";
import { resolvePublicStorageUrl } from "@/services/storage";
import { shortLocationForCard } from "@/lib/addressUtils";
import { getActiveCollaborations, type Collaboration } from "@/services/collaborations";
import { useLeadCaptureOptional } from "@/contexts/LeadCaptureContext";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import PartnersVenueShowcase from "@/components/ui/partners-venue-showcase";
import type { PartnerVenueCardData } from "@/components/ui/partner-venue-card";

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
      fullBleed
      contentClassName="py-6 md:py-8"
    >
      <PartnersVenueShowcase venues={venueCards} />
    </HomeSectionShell>
  );
};

export default CollaborationsSection;
