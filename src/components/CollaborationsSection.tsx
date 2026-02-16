import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getActiveCollaborations, Collaboration } from "@/services/collaborations";

const CollaborationsSection = () => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);

  useEffect(() => {
    getActiveCollaborations()
      .then((data) => {
        setCollaborations(data);
      })
      .catch((err) => {
        console.error("Failed to fetch collaborations:", err);
      });
  }, []);

  // Duplicate data for infinite scroll effect
  const duplicated = [...collaborations, ...collaborations];

  if (collaborations.length === 0) return null;

  return (
    <section className="pt-4 md:pt-6 lg:pt-8 pb-12 md:pb-16 -mb-24 relative z-20 overflow-hidden bg-background transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background dark:from-primary/10 dark:via-navy dark:to-navy opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 relative z-10">
        <div className="flex flex-col items-center justify-center gap-4 mb-8 text-center">
          {/* Elegant heading centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full"
          >
            <p className="text-primary font-sans text-sm md:text-base tracking-[0.25em] uppercase mb-3 font-medium">
              Our Partners
            </p>
            <SectionHeading className="text-foreground font-display font-medium leading-tight text-4xl md:text-5xl">
              Trusted By <span className="italic text-primary">Elegant Venues</span>
            </SectionHeading>
          </motion.div>

        </div>
      </div>

      {/* Horizontal infinite scroll of hotel logos – Full Width */}
      <div className="w-full overflow-hidden">
        <div className="collaborations-logo-mask overflow-hidden pt-0 pb-0">
          <div className="collaborations-logo-track flex gap-6 md:gap-8 px-4">
            {duplicated.map((venue, index) => (
              <div
                key={`${venue.id}-${index}`}
                // Increased card size significantly as requested
                className="collaborations-logo-item flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] group"
              >
                <Link to={`/collaborations/${venue.id}`}>
                  <div className="bg-card dark:bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(232,175,193,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(232,175,193,0.22)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:ring-2 hover:ring-primary/20 dark:hover:ring-primary/40 border border-transparent dark:border-white/5">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={venue.logo_url || "/placeholder.svg"} // Fallback image
                        alt={venue.name}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-sm font-display font-medium text-foreground dark:text-white truncate px-1">{venue.name}</p>
                      <p className="text-[11px] text-muted-foreground dark:text-gray-400 uppercase tracking-wider mt-1">{venue.location || "Partner Venue"}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollaborationsSection;
