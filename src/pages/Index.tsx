import { Suspense, lazy, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import SectionSeparator from "@/components/SectionSeparator";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import { SEO } from "@/components/SEO";
import { EventPlanningBusinessSchema, OrganizationSchema } from "@/components/StructuredData";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

// Lazy Load Below-the-Fold Sections
const ReelsSection = lazy(() => import("@/components/ReelsSection"));
const EventsSection = lazy(() => import("@/components/EventsSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const CollaborationsSection = lazy(() => import("@/components/CollaborationsSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSectionNew"));
const VideoFeatureSection = lazy(() => import("@/components/VideoFeatureSection"));
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



      <div className="min-h-screen bg-transparent text-foreground antialiased main-page-flow">
        <Navbar />
        <main>
          {/* Hero (Cinematic + Petals) - Rendered Immediately */}
          <div id="home">
            <HeroSection />
          </div>

          {/* Fallback Loader */}
          <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>

            {/* Collaborations / Elegant Venues (above, compact) */}
            <div id="venues">
              <CollaborationsSection />
            </div>

            {/* Reels (Visual Proof) */}
            <div id="reels">
              <ReelsSection />
            </div>

            {/* About Us – shuffle grid here uses gallery from Admin → Gallery (gallery-images) */}
            <div id="about">
              <AboutSection />
            </div>

            {/* Events (Keep) */}
            <div id="events">
              <EventsSection />
            </div>

            {/* Services (3D Flip) */}
            <div id="services">
              <ServicesSection />
            </div>

            {/* Testimonials (Trust) */}
            <div id="testimonials">
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
