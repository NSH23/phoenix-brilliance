import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

import ReelsSection from "@/components/ReelsSection";
import EventsSection from "@/components/EventsSection";
import ServicesSection from "@/components/ServicesSection";
import CollaborationsSection from "@/components/CollaborationsSection";
import TestimonialsSection from "@/components/TestimonialsSectionNew";
import VideoFeatureSection from "@/components/VideoFeatureSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import SectionSeparator from "@/components/SectionSeparator";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import { SEO } from "@/components/SEO";
import { OrganizationSchema } from "@/components/StructuredData";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const Index = () => {
  const { contact, socialLinks } = useSiteConfig();

  const sameAs: string[] = [];
  if (socialLinks.facebook) sameAs.push(socialLinks.facebook);
  if (socialLinks.instagram) sameAs.push(socialLinks.instagram);
  if (socialLinks.youtube) sameAs.push(socialLinks.youtube);
  if (socialLinks.twitter) sameAs.push(socialLinks.twitter);

  return (
    <>
      <SEO
        title="Phoenix Events & Production"
        description="Premium event planning and production services in Pune, Maharashtra. Specializing in weddings, corporate events, birthdays, and celebrations."
        keywords="event planning, wedding planning, corporate events, Pune events, Maharashtra event planners, party organizers"
        url="/"
      />
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
          {/* Hero (Cinematic + Petals) */}
          <div id="home">
            <HeroSection />
          </div>


          {/* Collaborations / Elegant Venues (above, compact) */}
          <div id="venues">
            <CollaborationsSection />
          </div>




          {/* Reels (Visual Proof) */}
          <div id="reels">
            <ReelsSection />
          </div>

          {/* About Us (New Horizontal Curtain Reveal) */}
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


          {/* Video Feature (Cinematic End) */}

        </main>
        <Footer />
        <WhatsAppButton />
        <MobileCTA />
      </div>
    </>
  );
};

export default Index;
