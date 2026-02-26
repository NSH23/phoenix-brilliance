import { Suspense, lazy } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import { SEO } from "@/components/SEO";
import { EventPlanningBusinessSchema, OrganizationSchema } from "@/components/StructuredData";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

// Lazy Load Below-the-Fold Sections
const ReelsSection = lazy(() => import("@/components/ReelsSection"));
const EventsSection = lazy(() => import("@/components/EventsSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const WhyChooseUsSection = lazy(() => import("@/components/WhyChooseUsSection"));
const CollaborationsSection = lazy(() => import("@/components/CollaborationsSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSectionNew"));
const AboutSection = lazy(() => import("@/components/AboutSection"));

const Index = () => {
  const { contact, socialLinks } = useSiteConfig();

  const sameAs: string[] = [];
  if (socialLinks.facebook) sameAs.push(socialLinks.facebook);
  if (socialLinks.instagram) sameAs.push(socialLinks.instagram);
  if (socialLinks.youtube) sameAs.push(socialLinks.youtube);
  if (socialLinks.twitter) sameAs.push(socialLinks.twitter);

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
          telephone: contact?.phone || "+91 70667 63276",
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



      <div className="relative min-h-screen bg-transparent text-foreground antialiased main-page-flow">
        {/* Global environmental background – subtle radial gradients, pointer-events-none */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,107,138,0.06),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(255,200,150,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(212,107,138,0.08),transparent_60%),radial-gradient(circle_at_80%_90%,rgba(100,120,255,0.06),transparent_60%)]"
          aria-hidden
        />
        <Navbar />
        <main className="[&>*]:my-0">
          {/* Hero (Cinematic + Petals) - Rendered Immediately */}
          <div id="home" className="my-0 hero-bg-wrapper relative">
            <div className="hero-bg-image" aria-hidden />
            <div className="hero-bg-overlay" aria-hidden />
            <HeroSection />
          </div>

          {/* Fallback Loader */}
          <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>

            {/* Collaborations / Elegant Venues – light: 3.jpg + overlay; dark: bg12.jpg */}
            <div id="venues" className="my-0 section-band-1 section-depth-bg section-flat section-border-t section-collaborations">
              <div className="section-depth-noise" aria-hidden />
              {/* Light theme only: 3.jpg – full section, subtle overlay for readability */}
              <div
                className="absolute inset-0 z-[1] pointer-events-none dark:opacity-0"
                aria-hidden
              >
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: "url('/3.jpg')" }}
                />
                <div className="absolute inset-0 bg-white/50 dark:bg-transparent" />
              </div>
              <div className="section-collaborations-bg-image" aria-hidden />
              <CollaborationsSection />
            </div>

            {/* Reels (Moments We've Crafted) – no background image */}
            <div id="reels" className="my-0 section-band-1 section-depth-bg section-flat section-border-t section-reels">
              <div className="section-depth-noise" aria-hidden />
              <ReelsSection />
            </div>

            {/* About Us */}
            <div id="about" className="my-0 section-band-1 section-depth-bg section-flat section-border-t section-about">
              <div className="section-depth-noise" aria-hidden />
              <div className="section-about-bg-image" aria-hidden />
              <div className="section-about-overlay" aria-hidden />
              <AboutSection />
            </div>

            {/* Events – light: 9.jpg + overlay; dark: solid band */}
            <div id="events" className="my-0 section-band-1 section-depth-bg section-flat section-border-t section-events relative">
              <div className="section-depth-noise" aria-hidden />
              {/* Light theme only: 9.jpg – full section, subtle overlay for readability */}
              <div
                className="absolute inset-0 z-[1] pointer-events-none dark:opacity-0"
                aria-hidden
              >
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: "url('/9.jpg')" }}
                />
                <div className="absolute inset-0 bg-white/50 dark:bg-transparent" />
              </div>
              <EventsSection />
            </div>

            {/* Services */}
            <div id="services" className="my-0 section-band-1 section-depth-bg section-flat section-border-t">
              <div className="section-depth-noise" aria-hidden />
              <ServicesSection />
            </div>

            {/* Why Choose Us – light: 5.jpg + overlay; dark: solid band */}
            <div id="why-choose-us" className="my-0 section-band-1 section-depth-bg section-flat section-border-t section-why-choose-us relative">
              <div className="section-depth-noise" aria-hidden />
              {/* Light theme only: 5.jpg – full section, subtle overlay for readability */}
              <div
                className="absolute inset-0 z-[1] pointer-events-none dark:opacity-0"
                aria-hidden
              >
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: "url('/5.jpg')" }}
                />
                <div className="absolute inset-0 bg-white/50 dark:bg-transparent" />
              </div>
              <div className="section-why-choose-us-bg-image" aria-hidden />
              <div className="section-why-choose-us-overlay" aria-hidden />
              <WhyChooseUsSection />
            </div>

            {/* Testimonials */}
            <div id="testimonials" className="my-0 section-band-1 section-depth-bg section-flat section-border-t section-testimonials">
              <div className="section-depth-noise" aria-hidden />
              <div className="section-testimonials-bg-image" aria-hidden />
              <div className="section-testimonials-overlay" aria-hidden />
              <TestimonialsSection />
            </div>

          </Suspense>
        </main>
        <Footer />
        <WhatsAppButton />
        <MobileCTA />
      </div>
    </>
  );
};

export default Index;
