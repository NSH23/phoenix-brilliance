import { Suspense, lazy } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { SEO } from "@/components/SEO";
import { EventPlanningBusinessSchema, OrganizationSchema } from "@/components/StructuredData";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useHomepageData } from "@/hooks/useHomepageData";

const ReelsSection = lazy(() => import("@/components/ReelsSection"));
const EventsSection = lazy(() => import("@/components/EventsSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const WhyChooseUsSection = lazy(() => import("@/components/WhyChooseUsSection"));
const CollaborationsSection = lazy(() => import("@/components/CollaborationsSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSectionNew"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const FinalCTASection = lazy(() => import("@/components/FinalCTASection"));

function SectionFallback() {
  return (
    <div className="py-12 md:py-16" aria-hidden>
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-12 w-2/3 max-w-md animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

const SectionSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SectionFallback />}>{children}</Suspense>
);

const Index = () => {
  const { contact, socialLinks } = useSiteConfig();
  const { data: homepageData, isPending: homepageDataPending, isSuccess: homepageDataSuccess } =
    useHomepageData();

  const sameAs: string[] = [];
  if (socialLinks.facebook) sameAs.push(socialLinks.facebook);
  if (socialLinks.instagram) sameAs.push(socialLinks.instagram);
  if (socialLinks.youtube) sameAs.push(socialLinks.youtube);
  if (socialLinks.twitter) sameAs.push(socialLinks.twitter);

  return (
    <>
      <SEO
        title="Phoenix Events & Production | Wedding & Corporate Event Management in Pune"
        description="Premium wedding and corporate event planning company in Pune. Luxury décor and venue collaborations."
        keywords="event planning, wedding planning, corporate events, Pune events, Maharashtra event planners, party organizers"
        url="/"
      />
      <EventPlanningBusinessSchema />
      <OrganizationSchema
        contactPoint={{
          telephone: contact?.phone || "+91 88880 82509",
          contactType: "Customer Service",
          email: contact?.email || "hello@phoenixevents.com",
        }}
        address={{
          addressLocality: contact?.address?.includes("Pune") ? "Pune" : "Pune",
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        }}
        sameAs={sameAs.length > 0 ? sameAs : undefined}
      />

      <div className="relative min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        <main>
          <div id="home">
            <HeroSection />
          </div>

          <SectionSuspense>
            <div id="venues">
              <CollaborationsSection
                homepageDataPending={homepageDataPending}
                prefetchedCollaborations={homepageDataSuccess ? homepageData?.collaborations : undefined}
              />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <div id="reels">
              <ReelsSection />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <div id="about">
              <AboutSection />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <div id="events">
              <EventsSection
                homepageDataPending={homepageDataPending}
                prefetchedEvents={homepageDataSuccess ? homepageData?.events : undefined}
              />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <div id="services">
              <ServicesSection
                homepageDataPending={homepageDataPending}
                prefetchedServices={homepageDataSuccess ? homepageData?.services : undefined}
              />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <div id="why-choose-us">
              <WhyChooseUsSection
                homepageDataPending={homepageDataPending}
                prefetchedWhyStats={homepageDataSuccess ? homepageData?.whyStats : undefined}
                prefetchedWhyReasons={homepageDataSuccess ? homepageData?.whyReasons : undefined}
                prefetchedWhyContent={homepageDataSuccess ? homepageData?.whyContent : undefined}
              />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <div id="testimonials">
              <TestimonialsSection
                homepageDataPending={homepageDataPending}
                prefetchedTestimonials={homepageDataSuccess ? homepageData?.testimonials : undefined}
              />
            </div>
          </SectionSuspense>

          <SectionSuspense>
            <FinalCTASection />
          </SectionSuspense>
        </main>
      </div>
    </>
  );
};

export default Index;
