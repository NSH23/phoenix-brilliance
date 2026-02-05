import Navbar from "@/components/Navbar";
import { SplitScreenHero, DEFAULT_SCENES } from "@/components/SplitScreenHero";
import CollaborationsCarousel from "@/components/CollaborationsCarousel";
import PolaroidGallerySection from "@/components/PolaroidGallerySection";
import EventsSection from "@/components/EventsSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import ServicesSection from "@/components/ServicesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import { SEO } from "@/components/SEO";
import { OrganizationSchema } from "@/components/StructuredData";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const Index = () => {
  const { contact, socialLinks } = useSiteConfig();
  
  // Build social media URLs array for structured data
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
          telephone: contact?.phone || '+91 70667 63276',
          contactType: 'Customer Service',
          email: contact?.email || 'hello@phoenixevents.com'
        }}
        address={{
          addressLocality: contact?.address?.includes('Pune') ? 'Pune' : 'Pune',
          addressRegion: 'Maharashtra',
          addressCountry: 'IN'
        }}
        sameAs={sameAs.length > 0 ? sameAs : undefined}
      />
      <div className="min-h-screen bg-background text-foreground antialiased">
        <Navbar />
      <main className="flex flex-col">
        <SplitScreenHero id="home" scenes={DEFAULT_SCENES} />
        <CollaborationsCarousel />
        <PolaroidGallerySection />
        <EventsSection />
        <BeforeAfterSection />
        <ServicesSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileCTA />
      </div>
    </>
  );
};

export default Index;
