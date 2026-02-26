import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExpandingCards, CardItem } from "@/components/ui/expanding-cards";
import { getActiveServices } from "@/services/services";
import { getPublicUrl } from "@/services/storage";
import {
  Crown,
  Palette,
  Building2,
  Gift,
  Speaker,
  Camera,
  Mic2,
  MapPin,
  Sparkles,
  ArrowRight
} from "lucide-react";

// Helper to map icon names (if we stored them) or just use default icons
const ICON_MAP: Record<string, any> = {
  'Crown': Crown,
  'Palette': Palette,
  'Building2': Building2,
  'Gift': Gift,
  'Speaker': Speaker,
  'Camera': Camera,
  'Mic2': Mic2,
  'MapPin': MapPin
};

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";

const MobileServiceCarousel = ({ services }: { services: CardItem[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (services.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [services.length]);

  if (services.length === 0) return null;

  const currentService = services[index];

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-xl bg-muted/20 dark:bg-surface">
      <div className="relative w-full h-full"> {/* Container for absolute items */}
        <AnimatePresence initial={false} custom={index}>
          <motion.div
            key={currentService.id}
            custom={index}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col bg-card rounded-2xl overflow-hidden border-2 border-charcoal/35 dark:border-white/30 shadow-elevation-1 dark:shadow-elevation-1-dark transition-all duration-300 hover:border-charcoal/60 dark:hover:border-white/55 hover:ring-2 hover:ring-charcoal/15 dark:hover:ring-white/15 hover:shadow-card-hover dark:hover:shadow-card-hover-dark"
          >
            {/* Image Area */}
            <div className="relative h-[60%] w-full overflow-hidden">
              <img
                src={currentService.imgSrc}
                alt={currentService.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (currentService.fallbackImgSrc) {
                    e.currentTarget.src = currentService.fallbackImgSrc;
                  } else {
                    e.currentTarget.src = DEFAULT_SERVICE_IMAGE;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-full w-fit mb-2">
                  {currentService.icon}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 bg-card flex flex-col justify-center text-center">
              <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">
                {currentService.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 font-sans">
                {currentService.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-10">
          {services.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-primary" : "w-1.5 bg-primary/30"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ServicesSection = () => {
  const [services, setServices] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await getActiveServices();
        if (data && data.length > 0) {
          // Map DB items to Card items
          const mapped = data.map((s) => {
            // If icon name is stored in 'icon' field, try to map it, else default
            const IconComponent = (s.icon && ICON_MAP[s.icon as string]) ? ICON_MAP[s.icon as string] : Sparkles;

            const imgSrc = s.image_url
              ? (s.image_url.startsWith("http") ? s.image_url : getPublicUrl("service-images", s.image_url))
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
          setServices(mapped);
        } else {
          // Fallback / Default data if DB is empty
          // ... (We could keep the hardcoded constants as fallback, but for brevity I'll assume DB works or empty)
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  // Split into rows? Or just pass all? The expanding cards might handle it.
  // The original code split into 2 rows of 4.
  // If we have dynamic count, we can just render one big list or split evenly.

  const midPoint = Math.ceil(services.length / 2);
  const row1 = services.slice(0, midPoint);
  const row2 = services.slice(midPoint);

  if (!loading && services.length === 0) return null; // Hide if no services

  return (
    <section id="services" className="py-12 md:py-16 overflow-hidden relative bg-transparent">

      {/* Light theme: 7.jpg. Dark theme: background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat bg-[url('/7.jpg')] dark:bg-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-none dark:bg-[url('/1.5.jpg')] bg-cover bg-center bg-no-repeat"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-[5] bg-transparent dark:bg-black/40"
        aria-hidden
      />

      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        {/* Header – editorial left-accent (same as Events, Reels, Collaborations) */}
        <header className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1">
          <p className="text-primary font-sans font-semibold text-xs md:text-sm tracking-[0.2em] uppercase">
            What We Create
          </p>
          <h2 className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground dark:text-white">
            Our Services
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground dark:text-white/70 text-base md:text-lg leading-relaxed font-sans">
            Full-service event design, planning, and execution tailored to your vision.
          </p>
        </header>

        {/* Desktop View: Expanding Cards */}
        <div className="hidden md:block w-full">
          {row1.length > 0 && (
            <div className="w-full mb-4">
              <ExpandingCards items={row1} defaultActiveIndex={0} fallbackImgSrc={DEFAULT_SERVICE_IMAGE} />
            </div>
          )}
          {row2.length > 0 && (
            <div className="w-full">
              <ExpandingCards items={row2} defaultActiveIndex={0} fallbackImgSrc={DEFAULT_SERVICE_IMAGE} />
            </div>
          )}
        </div>

        {/* Mobile View: Auto-rotating Service Carousel */}
        <div className="md:hidden w-full relative min-h-[400px]">
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

      </div>
    </section>
  );
};

export default ServicesSection;
