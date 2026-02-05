import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Users,
  Award,
  Phone,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SEO } from "@/components/SEO";
import { getActiveServices, Service } from "@/services/services";
import { getServiceIcon } from "@/lib/serviceIcons";

// Service gradient configurations for fallback/default display
const SERVICE_GRADIENTS: Record<string, { gradient: string; bgColor: string; textColor: string }> = {
  "Event Planning": { 
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
    bgColor: "rgba(102, 126, 234, 0.08)",
    textColor: "#5B6DD9"
  },
  "Decoration": { 
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", 
    bgColor: "rgba(240, 147, 251, 0.08)",
    textColor: "#E74C8C"
  },
  "Stage & Lighting": { 
    gradient: "linear-gradient(135deg, #FFD93D 0%, #FF9800 100%)", 
    bgColor: "rgba(255, 217, 61, 0.08)",
    textColor: "#E68A00"
  },
  "Sound & DJ": { 
    gradient: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)", 
    bgColor: "rgba(255, 107, 157, 0.08)",
    textColor: "#C44569"
  },
  "Photography": { 
    gradient: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)", 
    bgColor: "rgba(78, 205, 196, 0.08)",
    textColor: "#3A9188"
  },
  "Catering": { 
    gradient: "linear-gradient(135deg, #95E1D3 0%, #38A89D 100%)", 
    bgColor: "rgba(149, 225, 211, 0.08)",
    textColor: "#2F8F84"
  },
  "Entertainment": { 
    gradient: "linear-gradient(135deg, #F38181 0%, #CE5A6F 100%)", 
    bgColor: "rgba(243, 129, 129, 0.08)",
    textColor: "#CE5A6F"
  },
  "Corporate": { 
    gradient: "linear-gradient(135deg, #6C5CE7 0%, #5B4FDB 100%)", 
    bgColor: "rgba(108, 92, 231, 0.08)",
    textColor: "#5B4FDB"
  },
  "Custom Theme": { 
    gradient: "linear-gradient(135deg, #A8E6CF 0%, #3EECAC 100%)", 
    bgColor: "rgba(168, 230, 207, 0.08)",
    textColor: "#2DB88A"
  },
};

// Default gradients for index-based fallback
const DEFAULT_GRADIENTS = [
  { gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", bgColor: "rgba(102, 126, 234, 0.08)", textColor: "#5B6DD9" },
  { gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", bgColor: "rgba(240, 147, 251, 0.08)", textColor: "#E74C8C" },
  { gradient: "linear-gradient(135deg, #FFD93D 0%, #FF9800 100%)", bgColor: "rgba(255, 217, 61, 0.08)", textColor: "#E68A00" },
  { gradient: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)", bgColor: "rgba(255, 107, 157, 0.08)", textColor: "#C44569" },
  { gradient: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)", bgColor: "rgba(78, 205, 196, 0.08)", textColor: "#3A9188" },
  { gradient: "linear-gradient(135deg, #95E1D3 0%, #38A89D 100%)", bgColor: "rgba(149, 225, 211, 0.08)", textColor: "#2F8F84" },
  { gradient: "linear-gradient(135deg, #F38181 0%, #CE5A6F 100%)", bgColor: "rgba(243, 129, 129, 0.08)", textColor: "#CE5A6F" },
  { gradient: "linear-gradient(135deg, #6C5CE7 0%, #5B4FDB 100%)", bgColor: "rgba(108, 92, 231, 0.08)", textColor: "#5B4FDB" },
  { gradient: "linear-gradient(135deg, #A8E6CF 0%, #3EECAC 100%)", bgColor: "rgba(168, 230, 207, 0.08)", textColor: "#2DB88A" },
];

function getServiceGradient(title: string, index: number) {
  // Try to match by title keywords
  for (const [key, value] of Object.entries(SERVICE_GRADIENTS)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  // Fallback to index-based gradient
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}



// Service card component
interface ServiceCardProps {
  service: Service;
  index: number;
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();
  const gradientConfig = getServiceGradient(service.title, index);
  const IconComponent = getServiceIcon(service.icon || "Sparkles");

  return (
    <motion.article
      ref={cardRef}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className="group relative"
    >
      <div 
        className="relative h-full bg-card rounded-[20px] p-6 sm:p-7 border border-border/60
                   transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
                   hover:shadow-[0_24px_56px_rgba(26,26,46,0.12)] dark:hover:shadow-[0_24px_56px_rgba(0,0,0,0.25)] hover:-translate-y-2
                   hover:border-primary/20 dark:hover:border-primary/30
                   focus-within:ring-2 focus-within:ring-primary/30"
      >
        {/* Icon */}
        <div 
          className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: gradientConfig.gradient,
            boxShadow: `0 4px 16px ${gradientConfig.textColor}30`,
          }}
        >
          <IconComponent className="w-7 h-7 text-white" aria-hidden />
        </div>
        
        {/* Title */}
        <h3 className="font-serif font-bold text-foreground text-xl sm:text-[22px] mb-3 leading-tight
                       group-hover:text-primary transition-colors duration-300">
          {service.title}
        </h3>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm sm:text-[15px] leading-relaxed mb-5 line-clamp-3">
          {service.description || "Professional service tailored to make your event extraordinary."}
        </p>
        
        {/* Features as pills */}
        {(service.features?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {service.features!.slice(0, 3).map((feature, featureIndex) => (
              <span
                key={featureIndex}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full
                          transition-all duration-300 cursor-default"
                style={{ 
                  background: gradientConfig.bgColor,
                  color: gradientConfig.textColor,
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        )}
        
        {/* Learn more - reveal on hover */}
        <div className="overflow-hidden border-t border-border/50 pt-4">
          <Link 
            to="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
            style={{ color: gradientConfig.textColor }}
          >
            Learn More
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// Loading skeleton for service cards
function ServiceCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
      <div className="h-6 bg-muted rounded-lg w-3/4 mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-3.5 bg-muted rounded w-full" />
        <div className="h-3.5 bg-muted rounded w-5/6" />
        <div className="h-3.5 bg-muted rounded w-4/6" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <div className="h-7 bg-muted rounded-full w-20" />
        <div className="h-7 bg-muted rounded-full w-24" />
        <div className="h-7 bg-muted rounded-full w-16" />
      </div>
    </div>
  );
}

// Trust indicator item
interface TrustItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function TrustItem({ icon, title, description }: TrustItemProps) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="w-12 h-12 rounded-[14px] bg-primary/15 
                      flex items-center justify-center mb-3 text-primary">
        {icon}
      </div>
      <h4 className="font-semibold text-foreground mb-1 text-[15px]">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  
  const trustRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  const isTrustInView = useInView(trustRef, { once: true, margin: "-100px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-100px" });

  useEffect(() => {
    getActiveServices()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SEO 
        title="Services"
        description="Comprehensive event planning and production services including decoration, photography, catering, sound & DJ, and more in Pune, Maharashtra."
        keywords="event planning services, decoration services Pune, event photography, catering services, sound system rental Maharashtra"
        url="/services"
      />
      <div className="min-h-screen bg-background">
        <Navbar />

      {/* Hero Section - elegant abstract gradient mesh */}
      <section 
        className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[75vh] flex items-center justify-center overflow-hidden"
        aria-label="Services hero"
      >
        {/* Abstract gradient mesh background */}
        <div className="absolute inset-0 services-page-mesh-bg" aria-hidden />
        {!shouldReduceMotion && (
          <>
            {/* Purple gradient mesh for light theme - smooth elegant movement */}
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-60" : "opacity-70"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 25% 35%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 65% 25%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 75% 55%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 45% 75%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 60%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 25% 35%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 115% 105% at 30% 35%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 105% 115% at 60% 60%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 100% 120% at 90% 80%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 110% 110% at 70% 50%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 115% 105% at 40% 25%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                    ],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1] }}
            />
            {/* Indigo blue layer */}
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-50" : "opacity-65"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 70% 25%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 35% 70%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 15% 45%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 55% 15%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 65%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 25%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 115% 120% at 60% 30%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 130% 100% at 20% 85%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 120% 115% at 45% 70%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 110% 120% at 55% 45%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 105% 125% at 75% 20%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                    ],
              }}
              transition={{ duration: 24, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 3 }}
            />
            {/* Purple layer */}
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-35" : "opacity-60"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(183, 110, 121, 0.15) 0%, transparent 60%)",
                      "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(247, 231, 206, 0.12) 0%, transparent 60%)",
                      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(183, 110, 121, 0.15) 0%, transparent 60%)",
                    ]
                  : [
                      "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 125% 115% at 50% 50%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 110% 130% at 65% 35%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 120% 120% at 85% 85%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 115% 125% at 25% 40%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 125% 115% at 70% 75%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                    ],
              }}
              transition={{ duration: 28, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 6 }}
            />
            {/* Cyan/blue accent for light theme - smooth elegant movement */}
            {!isDark && (
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                aria-hidden
                animate={{
                  background: [
                    "radial-gradient(ellipse 100% 120% at 25% 10%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 110% 115% at 40% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 120% 100% at 75% 90%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 115% 105% at 60% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 110% 110% at 45% 55%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 105% 115% at 30% 30%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 100% 120% at 25% 10%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                  ],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 1.5 }}
              />
            )}
            {/* Gold accent for light theme - smooth elegant movement */}
            {!isDark && (
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-35"
                aria-hidden
                animate={{
                  background: [
                    "radial-gradient(ellipse 90% 100% at 5% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 95% 105% at 25% 35%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 100% 90% at 95% 55%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 105% 95% at 70% 70%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 110% 110% at 50% 5%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 100% 100% at 15% 60%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 90% 100% at 5% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                  ],
                }}
                transition={{ duration: 26, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 4 }}
              />
            )}
          </>
        )}
        <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="typography-eyebrow inline-block text-primary mb-4"
          >
            What We Offer
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={`typography-hero mb-6 ${isDark ? "text-white" : "text-foreground"}`}
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`typography-body-lg max-w-3xl mx-auto ${isDark ? "text-white/90" : "text-muted-foreground"}`}
          >
            From event planning to decoration, photography, and entertainment — 
            we deliver end-to-end solutions to make your occasion unforgettable.
          </motion.p>
        </div>
        {/* Smooth merge: hero fades gently into background (theme-aware) */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1] hero-merge-gradient"
          style={{
            height: "clamp(180px, 28vh, 280px)",
          }}
          aria-hidden
        />
      </section>

      {/* Trust Indicators Section - Floating Card */}
      <section className="relative z-20 -mt-16 mb-12 sm:mb-16">
        <div className="container mx-auto px-4">
          <motion.div
            ref={trustRef}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
            animate={isTrustInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-[1100px] mx-auto bg-card/90 dark:bg-card/95 backdrop-blur-xl rounded-[20px] p-8 sm:p-10 
                       shadow-[0_8px_32px_rgba(26,26,46,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                       border border-border/80 dark:border-border
                       hover:border-primary/20 dark:hover:border-primary/30 transition-colors duration-300"
          >
            <div className="text-center mb-8">
              <h2 className="typography-section text-foreground mb-2">
                Everything You Need for a <span className="text-primary">Perfect Event</span>
              </h2>
              <p className="text-body-lg text-muted-foreground">
                Comprehensive event solutions tailored to your vision and budget.
              </p>
            </div>
            
            {/* Trust indicators grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
              <TrustItem 
                icon={<CheckCircle2 className="w-6 h-6" />}
                title="Full Planning"
                description="Complete event management from concept to execution"
              />
              <TrustItem 
                icon={<Users className="w-6 h-6" />}
                title="Expert Team"
                description="Dedicated professionals with years of experience"
              />
              <TrustItem 
                icon={<Award className="w-6 h-6" />}
                title="Flawless Execution"
                description="Attention to every detail for perfect events"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="relative py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 relative z-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 max-w-md mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="typography-subsection text-foreground mb-3">
                Services Coming Soon
              </h3>
              <p className="text-body-lg text-muted-foreground mb-8">
                We're preparing our service offerings. In the meantime, reach out to discuss your event needs.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground 
                         font-semibold hover:scale-105 transition-all duration-300 
                         shadow-lg hover:shadow-xl shadow-primary/30"
              >
                Get in Touch
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
              {services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section – gradient mesh, echoes hero */}
      <section 
        ref={ctaRef}
        className="relative py-12 sm:py-14 lg:py-16 overflow-hidden"
        aria-label="Plan your event"
      >
        <div className="absolute inset-0 services-cta-mesh-bg" aria-hidden />
        {!shouldReduceMotion && (
          <>
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-40" : "opacity-65"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 30% 40%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 60% 70%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 30%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 30% 40%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 100% 120% at 30% 40%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                      "radial-gradient(ellipse 120% 100% at 60% 70%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                      "radial-gradient(ellipse 110% 110% at 70% 30%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                      "radial-gradient(ellipse 100% 120% at 30% 40%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                    ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
            />
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-30" : "opacity-55"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 70% 60%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                      "radial-gradient(circle at 40% 25%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                      "radial-gradient(circle at 25% 65%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 60%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 110% 120% at 70% 60%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                      "radial-gradient(ellipse 120% 110% at 40% 25%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                      "radial-gradient(ellipse 100% 130% at 25% 65%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                      "radial-gradient(ellipse 110% 120% at 70% 60%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                    ],
              }}
              transition={{ duration: 14, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 }}
            />
            {!isDark && (
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-45"
                aria-hidden
                animate={{
                  background: [
                    "radial-gradient(ellipse 100% 120% at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
                    "radial-gradient(ellipse 120% 100% at 50% 50%, rgba(59, 130, 246, 0.18) 0%, transparent 70%)",
                    "radial-gradient(ellipse 100% 120% at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
                  ],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 }}
              />
            )}
          </>
        )}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-[640px] mx-auto px-4 text-center"
        >
          <div className="flex justify-center mb-5">
            <Sparkles className="w-12 h-12 text-primary" aria-hidden />
          </div>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 ${isDark ? "text-white" : "text-foreground"}`}>
            Ready to create your <span className="text-primary">dream event</span>?
          </h2>
          <p className={`text-base sm:text-lg mb-6 max-w-xl mx-auto leading-relaxed ${isDark ? "text-white/90" : "text-muted-foreground"}`}>
            Tell us about your vision and we will bring it to life with creativity and precision.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-[28px]
                       bg-primary text-primary-foreground font-semibold text-base
                       hover:scale-105 hover:shadow-xl transition-all duration-300
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Get a Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[28px] border-2 border-primary 
                       text-primary font-semibold text-sm
                       hover:bg-primary/10 transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              Call Us Now
            </a>
          </div>
          <p className={`mt-4 text-sm ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
            Response within 24 hours guaranteed
          </p>
        </motion.div>
      </section>

      <Footer />
      <WhatsAppButton />
      </div>
    </>
  );
}
