import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  Palette,
  Lightbulb,
  Music,
  Camera,
  UtensilsCrossed,
  Mic2,
  Building2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getActiveServices, Service } from "@/services/services";
import { getServiceIcon } from "@/lib/serviceIcons";
import { cn } from "@/lib/utils";

/* Flip cards: front = icon, title, brief; back = full details, pricing, CTA.
 * 3D flip on hover, compact card size.
 */

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  brief: string;
  icon: string;
  accentColor: string;
  features: string[];
  priceFrom?: string;
  slug?: string;
}

/* Brand-aligned accents: gold, rose-gold, copper (hex for gradient/shadow alpha) */
const ACCENT_COLORS = [
  "#C9A227", /* primary gold */
  "#B76E79", /* rose-gold */
  "#B8860B", /* dark gold */
  "#A67C52", /* warm copper */
  "#D4AF37", /* gold */
  "#C4956A", /* champagne */
  "#C9A227", /* gold */
  "#A67C52", /* copper */
];

const ICONS = [
  Calendar, Palette, Lightbulb, Music,
  Camera, UtensilsCrossed, Mic2, Building2,
];

const DEFAULT_SERVICES: ServiceCard[] = [
  { id: "1", title: "Event Planning & Management", description: "End-to-end event planning and execution, ensuring a seamless and stress-free experience from concept to completion.", brief: "Full planning & execution from concept to completion.", icon: "Calendar", accentColor: "#667eea", features: ["Venue Selection", "Budget Management", "Timeline Planning"], priceFrom: "₹25,000" },
  { id: "2", title: "Decoration & Design", description: "Stunning décor solutions that transform any venue into a magical and memorable space.", brief: "Transform your venue with stunning décor.", icon: "Palette", accentColor: "#f093fb", features: ["Theme Design", "Floral Arrangements", "Lighting"], priceFrom: "₹20,000" },
  { id: "3", title: "Stage & Lighting", description: "Professionally designed stages and lighting setups that create the perfect ambiance.", brief: "Custom stages and professional lighting.", icon: "Lightbulb", accentColor: "#FFD93D", features: ["Custom Stage", "Ambient Lighting", "Spotlights"], priceFrom: "₹15,000" },
  { id: "4", title: "Sound & DJ", description: "Premium sound systems and talented DJs to keep your celebration lively and engaging.", brief: "Professional sound and DJ services.", icon: "Music", accentColor: "#FF6B9D", features: ["Sound Systems", "DJ Services", "Audio Setup"], priceFrom: "₹18,000" },
  { id: "5", title: "Photography & Videography", description: "Capture every precious moment with cinematic visuals and professional storytelling.", brief: "Cinematic coverage of your special day.", icon: "Camera", accentColor: "#4ECDC4", features: ["Pre-Event Shoots", "Full Coverage", "Drone"], priceFrom: "₹30,000" },
  { id: "6", title: "Catering Services", description: "Exquisite culinary experiences tailored to your taste, style, and event requirements.", brief: "Exquisite cuisine for your event.", icon: "UtensilsCrossed", accentColor: "#95E1D3", features: ["Menu Planning", "Live Stations", "Multi-Cuisine"], priceFrom: "₹150/plate" },
  { id: "7", title: "Entertainment & Artists", description: "Top-tier entertainment that keeps your guests engaged and energized.", brief: "Top entertainment for your guests.", icon: "Mic2", accentColor: "#F38181", features: ["DJ", "Live Bands", "Performers"], priceFrom: "₹20,000" },
  { id: "8", title: "Corporate Branding", description: "Professional branding for corporate events, exhibitions, and product launches.", brief: "Branding for corporate events.", icon: "Building2", accentColor: "#6C5CE7", features: ["Stage Branding", "Digital Assets", "Launches"], priceFrom: "₹22,000" },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function getBrief(desc: string, maxLen = 60): string {
  if (desc.length <= maxLen) return desc;
  const cut = desc.slice(0, maxLen).lastIndexOf(" ");
  return (cut > 0 ? desc.slice(0, cut) : desc.slice(0, maxLen)) + "…";
}

const DUPLICATE_COPIES = 6;

function ServicesRow({
  services,
  direction,
  speed,
  isInView,
  prefersReducedMotion,
}: {
  services: ServiceCard[];
  direction: "left" | "right";
  speed: number;
  isInView: boolean;
  prefersReducedMotion: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const unitWidthRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || services.length === 0) return;

    const updateWidth = () => {
      unitWidthRef.current = track.scrollWidth / DUPLICATE_COPIES;
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(track);

    if (direction === "right" && posRef.current === 0 && unitWidthRef.current > 0) {
      posRef.current = unitWidthRef.current;
      track.style.transform = `translateX(${-posRef.current}px)`;
    }

    let rafId: number;
    const tick = () => {
      if (track && unitWidthRef.current > 0 && !pausedRef.current) {
        const step = direction === "left" ? speed : -speed;
        posRef.current += step;
        const unit = unitWidthRef.current;
        if (posRef.current >= unit) posRef.current -= unit;
        if (posRef.current < 0) posRef.current += unit;
        track.style.transform = `translateX(${-posRef.current}px)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [services.length, direction, speed]);

  const duplicated = Array.from({ length: DUPLICATE_COPIES }, () => services).flat();

  return (
    <div
      className="overflow-hidden py-5 md:py-8"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div
        ref={trackRef}
        className="flex gap-6 w-max"
        style={{ willChange: "transform" }}
      >
        {duplicated.map((service, index) => (
          <div
            key={`${service.id}-${index}`}
            className={cn(
              "flex-shrink-0 w-[min(100%,300px)] min-w-[260px] sm:min-w-[280px]",
              "transition-transform duration-300 hover:-translate-y-2.5 hover:scale-[1.02]",
              !prefersReducedMotion && index % 4 === 0 && "rotate-[-2deg] hover:rotate-0",
              !prefersReducedMotion && index % 4 === 1 && "rotate-[1deg] hover:rotate-0",
              !prefersReducedMotion && index % 4 === 2 && "rotate-[2deg] hover:rotate-0",
              !prefersReducedMotion && index % 4 === 3 && "rotate-[-1deg] hover:rotate-0"
            )}
          >
            <ServiceCardComponent
              service={service}
              index={index % services.length}
              isInView={isInView}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCardComponent({
  service,
  index,
  isInView,
}: {
  service: ServiceCard;
  index: number;
  isInView: boolean;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const IconComponent = getServiceIcon(service.icon) ?? ICONS[index % ICONS.length];
  const brief = service.brief || getBrief(service.description);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="service-flip-card w-full h-[280px] cursor-pointer"
      role="listitem"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((prev) => !prev)}
    >
      <div
        className="service-flip-inner w-full h-full"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* FRONT */}
        <div
          className="service-flip-front bg-card flex flex-col items-center justify-center p-5 
                     shadow-[0_4px_20px_rgba(28,25,23,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-white/10"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: `linear-gradient(135deg, ${service.accentColor}, ${service.accentColor}dd)`,
              boxShadow: `0 4px 12px ${service.accentColor}40`,
            }}
          >
            <IconComponent className="w-6 h-6 text-white" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-card-foreground text-center mb-1.5 line-clamp-2 leading-tight">
            {service.title}
          </h3>
          <p className="text-xs text-muted-foreground text-center line-clamp-2 leading-relaxed">
            {brief}
          </p>
        </div>

        {/* BACK */}
        <div
          className="service-flip-back bg-card p-4 flex flex-col 
                     shadow-[0_4px_20px_rgba(28,25,23,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)] border border-border dark:border-white/10"
          style={{ borderLeft: `4px solid ${service.accentColor}` }}
        >
          <h3 className="text-sm font-bold text-card-foreground mb-2 line-clamp-2">
            {service.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3 flex-1">
            {service.description}
          </p>
          <ul className="space-y-1 mb-3">
            {service.features.slice(0, 3).map((f) => (
              <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: service.accentColor }} />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to="/services"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-semibold 
                       text-white transition-all hover:opacity-90"
            style={{ background: service.accentColor }}
          >
            Learn More
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

const ServicesSection = () => {
  const [services, setServices] = useState<ServiceCard[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.2, once: true });
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    getActiveServices()
      .then((data: Service[]) => {
        if (data.length > 0) {
          setServices(
            data.slice(0, 8).map((s, i) => {
              const def = DEFAULT_SERVICES[i];
              return {
                id: s.id,
                title: s.title,
                description: s.description || def?.description || "",
                brief: getBrief(s.description || def?.description || ""),
                icon: s.icon || def?.icon || "Sparkles",
                accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
                features: s.features?.length ? s.features : def?.features || [],
                priceFrom: def?.priceFrom || "Get Quote",
                slug: slugify(s.title),
              };
            })
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = services.length > 0 ? services : DEFAULT_SERVICES;

  /* Auto-scroll config: same pattern as gallery rows */
  const SCROLL_DIRECTION = "left" as const;
  const SCROLL_SPEED = 0.4;

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative overflow-hidden py-12 sm:py-14 lg:py-18 bg-gradient-to-b from-charcoal/5 via-background to-muted/20 dark:from-charcoal/30 dark:via-background dark:to-charcoal/20"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/[0.05] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <p className="section-eyebrow text-primary">What We Offer</p>
          <h2 className="section-heading">Our Services</h2>
          <p className="section-description">
            Comprehensive event solutions to bring your vision to life.
          </p>
        </motion.header>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <ServicesRow
            services={displayed}
            direction={SCROLL_DIRECTION}
            speed={prefersReducedMotion ? 0 : SCROLL_SPEED}
            isInView={prefersReducedMotion || isInView}
            prefersReducedMotion={!!prefersReducedMotion}
          />
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link to="/services" className="btn-section-cta group">
            <span>View All Services</span>
            <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
