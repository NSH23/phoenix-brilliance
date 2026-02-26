import { motion } from "framer-motion";
import { getPublicUrl } from "@/services/storage";
import { shortLocationForCard } from "@/lib/addressUtils";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getActiveCollaborations, Collaboration } from "@/services/collaborations";
import { useLeadCaptureOptional } from "@/contexts/LeadCaptureContext";

function resolveLogoUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return getPublicUrl("partner-logos", url);
}

const CollaborationsSection = () => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const leadCapture = useLeadCaptureOptional();
  const selectedVenue = leadCapture?.selectedVenue ?? null;

  useEffect(() => {
    getActiveCollaborations()
      .then((data) => {
        setCollaborations(data);
      })
      .catch((err) => {
        console.error("Failed to fetch collaborations:", err);
      });
  }, []);

  const displayed = useMemo(() => {
    if (!selectedVenue || selectedVenue.trim() === "") return collaborations;
    const v = selectedVenue.trim().toLowerCase();
    return collaborations.filter((c) => (c.name || "").trim().toLowerCase() === v);
  }, [collaborations, selectedVenue]);

  // Single card: show once, centered. Multiple: duplicate for infinite scroll
  const listToRender = displayed.length === 1 ? displayed : [...displayed, ...displayed];
  const singleCard = displayed.length === 1;

  if (collaborations.length === 0) return null;
  if (displayed.length === 0) return null;

  return (
    <section className="relative z-20 overflow-x-hidden overflow-y-visible bg-transparent transition-colors duration-500 pt-12 md:pt-16 pb-0 md:pb-1 mb-[-1rem] md:mb-[-1.5rem]" aria-labelledby="partners-heading">
      {/* Section header – aligned with Reels/About */}
      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1"
        >
          <p className="text-primary font-sans font-semibold text-xs md:text-sm tracking-[0.2em] uppercase">
            Our Partners
          </p>
          <h2 id="partners-heading" className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground">
            Trusted By <span className="italic text-primary">Elegant Venues</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed font-sans">
            Premium venues and spaces we&apos;re proud to partner with.
          </p>
        </motion.header>
      </div>

      {/* Cards container – full viewport width; no background image in container */}
      <div className="w-screen min-w-screen ml-[calc(-50vw+50%)] overflow-hidden">
        <div className={`relative w-full min-w-0 rounded-none border border-primary/30 dark:border-primary/25 overflow-hidden py-5 md:py-6 shadow-[0_4px_24px_rgba(232,175,193,0.14)] dark:shadow-elevation-1-dark ${singleCard ? "px-4 md:px-6" : "collaborations-logo-mask collaborations-logo-mask-no-fade"} bg-white/55 dark:bg-card/50 backdrop-blur-sm dark:border-white/25`}>
          <div className="relative z-10">
          <div className={singleCard ? "flex justify-center" : "collaborations-logo-track flex items-stretch gap-6 md:gap-8"}>
            {listToRender.map((venue, index) => {
              const isPremiumCard = singleCard && index === 0;
              const cardContent = (
                <>
                  <div className="aspect-[4/3] flex-shrink-0 overflow-hidden">
                    <img
                      src={resolveLogoUrl(venue.logo_url)}
                      alt={venue.name}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex-shrink-0 h-[5rem] flex flex-col items-center justify-center p-5 text-center">
                    <p className="text-base font-sans font-medium text-foreground dark:text-white truncate w-full px-1">{venue.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider mt-1.5 truncate w-full">{shortLocationForCard(venue.location)}</p>
                  </div>
                </>
              );
              return (
                <div
                  key={singleCard ? venue.id : `${venue.id}-${index}`}
                  className="collaborations-logo-item flex-shrink-0 w-[300px] sm:w-[360px] md:w-[420px] flex flex-col group"
                >
                  <Link to={`/collaborations/${venue.id}`} replace className="flex flex-col flex-1 min-h-0">
                    {isPremiumCard ? (
                      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-primary/30 to-transparent transition-all duration-300 ease-out hover:from-primary/40 flex-1 flex flex-col min-h-0">
                        <div className="bg-card rounded-2xl overflow-hidden border-0 shadow-elevation-1 dark:shadow-elevation-1-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark transition-all duration-300 ease-out hover:-translate-y-1 flex-1 flex flex-col min-h-0">
                          {cardContent}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-card rounded-xl overflow-hidden border border-border dark:border-white/10 shadow-elevation-1 dark:shadow-elevation-1-dark transition-all duration-300 ease-out hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:ring-1 hover:ring-primary/20 hover:-translate-y-1 flex-1 flex flex-col min-h-0">
                        {cardContent}
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollaborationsSection;
