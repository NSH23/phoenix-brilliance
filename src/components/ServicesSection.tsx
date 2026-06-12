import { useState, useEffect } from "react";
import { ExpandingCards, CardItem } from "@/components/ui/expanding-cards";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { HomeSectionBackground } from "@/components/ui/home-section-background";
import { MobileServiceCarousel } from "@/components/ui/mobile-service-carousel";
import { getActiveServices, type Service } from "@/services/services";
import { resolvePublicStorageUrl } from "@/services/storage";
import { getServiceIcon } from "@/lib/serviceIcons";

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";

function mapServicesToCards(data: Service[]): CardItem[] {
  if (!data.length) return [];
  return data.map((s) => {
    const IconComponent = getServiceIcon(s.icon);
    const imgSrc = s.image_url
      ? resolvePublicStorageUrl(s.image_url, "service-images")
      : "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";
    return {
      id: s.id,
      title: s.title,
      description: s.description || "",
      imgSrc,
      icon: <IconComponent size={24} />,
      linkHref: "/#services",
      fallbackImgSrc: DEFAULT_SERVICE_IMAGE,
    };
  });
}

type ServicesSectionProps = {
  prefetchedServices?: Service[];
  homepageDataPending?: boolean;
};

const ServicesSection = ({ prefetchedServices, homepageDataPending }: ServicesSectionProps = {}) => {
  const [services, setServices] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (homepageDataPending) return;

    async function fetchServices() {
      try {
        if (prefetchedServices !== undefined) {
          setServices(mapServicesToCards(prefetchedServices));
          return;
        }
        const data = await getActiveServices();
        setServices(mapServicesToCards(data || []));
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [homepageDataPending, prefetchedServices]);

  // Split into rows? Or just pass all? The expanding cards might handle it.
  // The original code split into 2 rows of 4.
  // If we have dynamic count, we can just render one big list or split evenly.

  const midPoint = Math.ceil(services.length / 2);
  const row1 = services.slice(0, midPoint);
  const row2 = services.slice(midPoint);

  if (!loading && services.length === 0) return null; // Hide if no services

  return (
    <HomeSectionShell
      ariaLabelledBy="services-heading"
      badge="What We Offer"
      title={<HomeSectionSplitTitle line1="Our" accent="Services" />}
      subtitle="Design, décor, and production tailored to every occasion."
      variant="linen"
      contentClassName="pt-1"
      backgroundOverlay={<HomeSectionBackground variant="soft-mesh" />}
    >
        {/* Desktop View: Expanding Cards */}
        <div className="hidden md:block w-full">
          {row1.length > 0 && (
            <div className="w-full mb-3">
              <ExpandingCards items={row1} defaultActiveIndex={0} fallbackImgSrc={DEFAULT_SERVICE_IMAGE} />
            </div>
          )}
          {row2.length > 0 && (
            <div className="w-full">
              <ExpandingCards items={row2} defaultActiveIndex={0} fallbackImgSrc={DEFAULT_SERVICE_IMAGE} />
            </div>
          )}
        </div>

        {/* Mobile View: swipeable service cards */}
        <div className="md:hidden w-full">
          <MobileServiceCarousel services={services} />
        </div>

    </HomeSectionShell>
  );
};

export default ServicesSection;
