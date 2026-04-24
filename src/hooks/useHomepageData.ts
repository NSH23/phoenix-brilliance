import { useQuery } from "@tanstack/react-query";
import { getEventsForHomepage } from "@/services/events";
import { getActiveServices } from "@/services/services";
import { getFeaturedTestimonials } from "@/services/testimonials";
import { getWhyChooseUsStats, getWhyChooseUsReasons } from "@/services/whyChooseUs";
import { getActiveCollaborations } from "@/services/collaborations";
import { getAboutSectionFlipImagesOptional, getSiteContentByKey } from "@/services/siteContent";
import type { AboutSectionFlipImages, SiteContent } from "@/services/siteContent";

const STALE_MS = 5 * 60 * 1000;

export type HomepageDataBundle = {
  events: Awaited<ReturnType<typeof getEventsForHomepage>>;
  services: Awaited<ReturnType<typeof getActiveServices>>;
  testimonials: Awaited<ReturnType<typeof getFeaturedTestimonials>>;
  whyStats: Awaited<ReturnType<typeof getWhyChooseUsStats>>;
  whyReasons: Awaited<ReturnType<typeof getWhyChooseUsReasons>>;
  collaborations: Awaited<ReturnType<typeof getActiveCollaborations>>;
  whyContent: SiteContent | null;
  /** null = loaded, no saved flip config; undefined = not part of bundle (unused) */
  aboutFlipImages: AboutSectionFlipImages | null;
};

export function useHomepageData() {
  return useQuery({
    queryKey: ["homepage-data"],
    queryFn: async (): Promise<HomepageDataBundle> => {
      const [events, services, testimonials, whyStats, whyReasons, collaborations, whyContent, aboutFlipImages] =
        await Promise.all([
          getEventsForHomepage(7).catch(() => [] as HomepageDataBundle["events"]),
          getActiveServices().catch(() => [] as HomepageDataBundle["services"]),
          getFeaturedTestimonials(10).catch(() => [] as HomepageDataBundle["testimonials"]),
          getWhyChooseUsStats().catch(() => [] as HomepageDataBundle["whyStats"]),
          getWhyChooseUsReasons().catch(() => [] as HomepageDataBundle["whyReasons"]),
          getActiveCollaborations().catch(() => [] as HomepageDataBundle["collaborations"]),
          getSiteContentByKey("why-us").catch(() => null),
          getAboutSectionFlipImagesOptional().catch(() => null as HomepageDataBundle["aboutFlipImages"]),
        ]);
      return {
        events,
        services,
        testimonials,
        whyStats,
        whyReasons,
        collaborations,
        whyContent,
        aboutFlipImages,
      };
    },
    staleTime: STALE_MS,
  });
}
