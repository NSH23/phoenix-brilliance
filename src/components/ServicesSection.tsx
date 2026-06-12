import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExpandingCards, CardItem } from "@/components/ui/expanding-cards";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { HomeSectionBackground } from "@/components/ui/home-section-background";
import { getActiveServices, type Service } from "@/services/services";
import { resolvePublicStorageUrl } from "@/services/storage";
import { getServiceIcon } from "@/lib/serviceIcons";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";

const MobileServiceCarousel = ({ services }: { services: CardItem[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (services.length === 0) return null;

  return (
    <div className="w-full pb-1">
      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: services.length > 1, containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {services.map((service, index) => (
            <CarouselItem key={service.id} className="basis-[88%] pl-3 sm:basis-[82%]">
              <div
                className={cn(
                  "flex h-[380px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-transform duration-300",
                  activeIndex === index ? "scale-100" : "scale-[0.97] opacity-90",
                )}
              >
                <div className="relative h-[52%] w-full overflow-hidden bg-muted/20">
                  <img
                    src={service.imgSrc}
                    alt={service.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (service.fallbackImgSrc) {
                        e.currentTarget.src = service.fallbackImgSrc;
                      } else {
                        e.currentTarget.src = DEFAULT_SERVICE_IMAGE;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md">
                    {service.icon}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center px-4 py-4 text-center">
                  <h3 className="font-serif text-lg font-semibold text-foreground">{service.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  {service.linkHref ? (
                    <Link
                      to={service.linkHref}
                      className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary"
                    >
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {services.length > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {services.map((service, i) => (
            <button
              key={service.id}
              type="button"
              aria-label={`Go to ${service.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
              )}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

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
      linkHref: "/services",
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

        {/* See more / Explore – only when more than 10 services */}
        {services.length > 10 && (
          <div className="mt-8 flex justify-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium font-sans tracking-[0.02em]
                         text-primary border border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60
                         transition-all duration-300"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

    </HomeSectionShell>
  );
};

export default ServicesSection;
