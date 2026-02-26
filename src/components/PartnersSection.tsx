import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getActiveCollaborations } from "@/services/collaborations";
import { getPublicUrl } from "@/services/storage";

function resolveLogoUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return getPublicUrl("partner-logos", url);
}

const PartnersSection = () => {
  const [partners, setPartners] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getActiveCollaborations()
      .then((data) => {
        setPartners(data.map((c) => ({ id: c.id, name: c.name, logo_url: c.logo_url })));
      })
      .catch((err) => {
        console.error("Failed to fetch partners:", err);
        setPartners([]);
      });
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || partners.length === 0) return;

    // ... (keep scrolling logic same)
    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      scrollPosition += scrollSpeed;
      if (scrollContainer.scrollWidth / 2 <= scrollPosition) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [partners.length]);

  if (partners.length === 0) return null; // Or return a placeholder if desired, but hiding section is safer if empty

  return (
    <section className="py-20 bg-background relative overflow-hidden transition-colors duration-500">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />

      <div className="container mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Trusted Partners
          </span>
          <h2 className="section-title mb-4">
            Our <span className="text-gradient-gold">Collaborations</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            We work with the finest venues, vendors, and brands to deliver exceptional experiences.
          </p>
        </motion.div>
      </div>

      {/* Auto-scrolling Logo Slider */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-hidden cursor-pointer"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate for seamless loop */}
        {[...partners, ...partners].map((partner, index) => (
          <motion.div
            key={`${partner.id}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (index % partners.length) * 0.05 }}
            className="flex-shrink-0"
          >
            <Link to={`/collaborations/${partner.id}`} replace className="block">
              <div className="w-48 h-24 flex items-center justify-center rounded-xl 
                            bg-card/50 dark:bg-card/30 backdrop-blur-sm border border-border/50
                            hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
                            transition-all duration-300 group overflow-hidden p-4">
                {partner.logo_url ? (
                  <img
                    src={resolveLogoUrl(partner.logo_url)!}
                    alt={partner.name}
                    className="w-full h-full object-contain filter grayscale-0 transition-all duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-center">
                    <span className="font-serif text-lg font-semibold text-foreground/70 
                                   group-hover:text-primary transition-colors duration-300">
                      {partner.name}
                    </span>
                    <div className="w-8 h-0.5 bg-primary/30 mx-auto mt-1 
                                  group-hover:w-12 group-hover:bg-primary transition-all duration-300" />
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-20 pointer-events-none" />

      {/* View Collaborations CTA */}
      <div className="container mx-auto px-4 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Link
            to="/collaborations"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full
                     bg-gradient-to-r from-primary/10 to-rose-gold/10 
                     border-2 border-primary/30 text-foreground font-semibold
                     hover:border-primary hover:shadow-xl hover:shadow-primary/20
                     transition-all duration-300 group"
          >
            <span>View All Collaborations</span>
            <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
