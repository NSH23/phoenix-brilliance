import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getActiveCollaborations } from "@/services/collaborations";

/** Our Collaborations - horizontal scrolling squared cards (replaces marquee) */
const CollaborationsCarousel = () => {
  const [partners, setPartners] = useState<{ name: string; logo_url: string | null }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getActiveCollaborations()
      .then((data) => setPartners(data.map((c) => ({ name: c.name, logo_url: c.logo_url }))))
      .catch(() => setPartners([]));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || partners.length === 0) return;

    let pos = 0;
    const speed = 0.6;
    let id: number;

    const tick = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);

    const pause = () => cancelAnimationFrame(id);
    const resume = () => { id = requestAnimationFrame(tick); };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, [partners.length]);

  return (
    <section className="relative w-full py-6 sm:py-8 bg-muted/90 dark:bg-charcoal/90 backdrop-blur-sm border-y border-border dark:border-ivory/10 min-h-[140px] flex flex-col justify-center">
      <p className="text-center text-muted-foreground dark:text-ivory/70 text-xs tracking-[0.3em] uppercase mb-3">
        Our Collaborations
      </p>
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-hidden px-4 sm:px-6"
        style={{ scrollBehavior: "auto" }}
      >
        {partners.length === 0 ? (
          <div className="flex-1 min-h-[96px]" aria-hidden />
        ) : (
        [...partners, ...partners].map((p, i) => (
          <motion.div
            key={`${p.name}-${i}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i % partners.length * 0.03, duration: 0.4 }}
            className="flex-shrink-0"
          >
            <Link
              to="/collaborations"
              className="block w-44 sm:w-48 h-24 sm:h-28 
                         flex items-center justify-center rounded-xl
                         bg-background/60 dark:bg-ivory/5 backdrop-blur-sm border border-border dark:border-ivory/20
                         hover:border-primary/50 hover:bg-background/80 dark:hover:bg-ivory/10 
                         hover:shadow-lg transition-all duration-300 group"
            >
              {/* Always show name only, never logo on homepage */}
              <div className="text-center px-2">
                <span className="font-medium text-foreground dark:text-ivory/90 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {p.name}
                </span>
                <div className="w-6 h-0.5 bg-primary/30 mx-auto mt-1 group-hover:bg-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        )))}
      </div>
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-muted/90 dark:from-charcoal/90 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-muted/90 dark:from-charcoal/90 to-transparent pointer-events-none" />
    </section>
  );
};

export default CollaborationsCarousel;
