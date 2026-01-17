import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const partners = [
  { name: "Grand Hyatt", logo: "Grand Hyatt" },
  { name: "The Leela Palace", logo: "The Leela" },
  { name: "Taj Hotels", logo: "Taj Hotels" },
  { name: "ITC Hotels", logo: "ITC Hotels" },
  { name: "Oberoi Hotels", logo: "Oberoi" },
  { name: "Canon Events", logo: "Canon" },
  { name: "Sony Professional", logo: "Sony Pro" },
  { name: "Bose Audio", logo: "Bose" },
  { name: "Philips Lighting", logo: "Philips" },
  { name: "Sennheiser", logo: "Sennheiser" },
  { name: "Marriott Hotels", logo: "Marriott" },
  { name: "Four Seasons", logo: "Four Seasons" },
];

const PartnersSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

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
  }, []);

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
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
        className="flex gap-8 overflow-x-hidden cursor-default"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate for seamless loop */}
        {[...partners, ...partners].map((partner, index) => (
          <motion.div
            key={`${partner.name}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (index % partners.length) * 0.05 }}
            className="flex-shrink-0"
          >
            <div className="w-48 h-24 flex items-center justify-center rounded-xl 
                          bg-card/50 dark:bg-card/30 backdrop-blur-sm border border-border/50
                          hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
                          transition-all duration-300 group">
              <div className="text-center">
                <span className="font-serif text-lg font-semibold text-foreground/70 
                               group-hover:text-primary transition-colors duration-300">
                  {partner.logo}
                </span>
                <div className="w-8 h-0.5 bg-primary/30 mx-auto mt-1 
                              group-hover:w-12 group-hover:bg-primary transition-all duration-300" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-20 pointer-events-none" />
    </section>
  );
};

export default PartnersSection;
