import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import { ExpandingCards, CardItem } from "@/components/ui/expanding-cards";
import { getActiveServices } from "@/services/services";
import {
  Crown,
  Palette,
  Building2,
  Gift,
  Speaker,
  Camera,
  Mic2,
  MapPin,
  Sparkles
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
    <div className="relative w-full h-[400px] overflow-hidden rounded-xl bg-muted/20">
      <div className="relative w-full h-full"> {/* Container for absolute items */}
        <AnimatePresence initial={false} custom={index}>
          <motion.div
            key={currentService.id}
            custom={index}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col bg-background" // Ensure background to cover exiting slide
          >
            {/* Image Area */}
            <div className="relative h-[60%] w-full overflow-hidden">
              <img
                src={currentService.imgSrc}
                alt={currentService.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-full w-fit mb-2">
                  {currentService.icon}
                </div>
              </div>
            </div>

            {/* Text Area */}
            <div className="flex-1 p-6 bg-card flex flex-col justify-center text-center">
              <h3 className="text-xl font-bold mb-2 text-foreground font-display">
                {currentService.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
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

            return {
              id: s.id,
              title: s.title,
              description: s.description || "",
              imgSrc: s.image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", // fallback
              icon: <IconComponent size={24} />,
              linkHref: "/services"
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
    <section id="services" className="py-10 md:py-16 overflow-hidden relative bg-background">


      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 flex flex-col items-center relative z-10">
        <div className="mb-12 text-center">
          <p className="text-primary font-sans text-sm md:text-base tracking-[0.25em] uppercase mb-3 font-medium">
            Our Services
          </p>
          <SectionHeading className="text-foreground dark:text-white font-display font-medium leading-tight text-4xl md:text-5xl whitespace-nowrap">
            What We <span className="italic text-primary">Create</span>
          </SectionHeading>
        </div>

        {/* Desktop View: Expanding Cards */}
        <div className="hidden md:block w-full">
          {row1.length > 0 && (
            <div className="w-full mb-4">
              <ExpandingCards items={row1} defaultActiveIndex={0} />
            </div>
          )}
          {row2.length > 0 && (
            <div className="w-full">
              <ExpandingCards items={row2} defaultActiveIndex={0} />
            </div>
          )}
        </div>

        {/* Mobile View: Auto-rotating Service Carousel */}
        <div className="md:hidden w-full relative min-h-[400px]">
          <MobileServiceCarousel services={services} />
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
