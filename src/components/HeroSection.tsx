import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { getHeroMedia } from "@/services/contentMedia";
import { StackedCards } from "@/components/ui/stacked-cards";
import { HeroBackgroundPattern } from "@/components/ui/HeroBackgroundPattern";
import { getSiteContentByKey } from "@/services/siteContent";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const { data: heroMedia } = useQuery({
    queryKey: ["hero-media"],
    queryFn: async () => {
      try {
        return await getHeroMedia();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: heroContent } = useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      try {
        const content = await getSiteContentByKey("home-hero").catch(() => null);
        if (!content) return null;

        const desc = content.description?.trim() || "";
        const isOldLongCopy = desc.includes("From weddings to corporate celebrations");
        return {
          title: content.title || "Crafting Moments That Last Forever",
          subtitle: content.subtitle || "Phoenix Events & Production",
          description: isOldLongCopy ? "" : desc,
          cta_text: content.cta_text || "Plan Your Event",
          cta_link: content.cta_link || "/contact",
        };
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const { scrollY } = useScroll({ layoutEffect: false });
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);

  const heroItems = (() => {
    // Keep the same initial UI behavior: render the placeholder until query resolves.
    if (heroMedia === undefined) return [];

    const media = heroMedia;
    const items: string[] = [];

    if (media?.videoUrl) items.push(media.videoUrl);
    if (media?.imageUrls?.length >= 2) {
      items.push(media.imageUrls[0], media.imageUrls[1]);
    } else if (media?.imageUrls?.length === 1) {
      items.push(media.imageUrls[0], media.imageUrls[0]);
    }

    return items.length > 0 ? items : ["/1.mp4"];
  })();

  // Non-blocking load: we render the structure immediately and let the video component handle the empty/loading state gracefully.

  // Parse title to handle potential newlines or specific formatting if needed
  // For now, we'll keep the specialized formatting for "Forever" manually or assume the input handles it.
  // To keep the visual design with "Forever" emphasized, we might need to parse the title string or just use the description/subtitle dynamically.
  // The current design splits the title into lines.

  // Let's use the fetched content but keep the visual structure if possible.
  // If the user changes the title completely, the "Forever" animation might be lost or need to be adaptable.
  // For this iteration, we will render the dynamic title directly, but maybe keep the "Forever" underline if the title contains it?
  // Simpler approach: Render the dynamic title. If it's the default, render the fancy version.

  const isDefaultTitle = !heroContent || heroContent.title.includes("Crafting Moments That Last Forever");

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden md:overflow-visible bg-transparent pt-24 pb-0 text-foreground hero-section-content"
      aria-label="Hero"
    >
      <HeroBackgroundPattern />

      <div className="container relative z-10 px-4 md:px-6 grid lg:grid-cols-2 gap-4 md:gap-10 lg:gap-12 items-center">

        {/* LEFT: Text Content */}
        <motion.div
          style={{ y: isDesktop ? y1 : 0 }}
          className="text-center lg:text-left space-y-4 md:space-y-5 relative z-20 max-w-2xl rounded-2xl md:rounded-3xl border border-white/45 bg-white/25 dark:bg-black/20 backdrop-blur-xl px-4 py-5 md:px-7 md:py-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4"
          >
            <h1 className="font-serif text-4xl md:text-5xl xl:text-6xl font-medium tracking-tight leading-[1.08] hero-heading-gradient">
              {isDefaultTitle ? (
                <>
                  Crafting Moments <br />
                  That Last <br />
                  <span className="italic text-primary">Forever</span>
                </>
              ) : (
                (heroContent?.title || "").split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))
              )}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="font-sans text-base md:text-lg font-normal tracking-normal leading-relaxed text-foreground/80 dark:text-white/80"
            >
              {heroContent?.description?.trim() || "Your vision, our craft—unforgettable events."}
            </motion.p>
          </motion.div>

          {/* Founder story – refined label + body */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="pl-0 lg:pl-4 border-l-0 lg:border-l-2 border-primary/35 lg:border-primary/45 bg-white/40 dark:bg-black/20 rounded-xl lg:rounded-none p-3 lg:p-0"
          >
            <h2 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-foreground mb-1">
              Kevin
            </h2>
            <p className="font-sans text-[0.7rem] font-medium tracking-eyebrow uppercase text-primary mb-3">
              Founder & Creative Director
            </p>
            <p className="font-sans text-sm md:text-[15px] text-foreground/75 dark:text-white/75 font-normal leading-relaxed tracking-normal">
              A visionary in event design, Kevin transforms ideas into elegant, unforgettable experiences. Since 2017, his passion for perfection and eye for detail have shaped Phoenix into a trusted name in premium celebrations.
            </p>
            <p className="font-sans text-sm md:text-[15px] font-medium text-primary/95 dark:text-primary mt-2.5 italic">
              Where creativity meets flawless execution
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
          >
            <Button size="lg" className="font-sans font-medium tracking-[0.02em] h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-full shadow-warm-lg hover:shadow-warm-xl transition-all duration-300" asChild>
              <Link to={heroContent?.cta_link || "/contact"}>
                {heroContent?.cta_text || "Plan Your Event"}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="font-sans font-medium tracking-[0.02em] h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-full border-2 border-primary/50 text-foreground bg-background/50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group" asChild>
              <Link to="/gallery">
                View Our Work <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex items-center gap-4 sm:gap-6 justify-center lg:justify-start pt-4 border-t border-border/40"
          >
            <div className="text-center lg:text-left">
              <p className="font-serif text-2xl md:text-3xl font-semibold text-primary tabular-nums">500+</p>
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-[0.15em] mt-2">Events</p>
            </div>
            <div className="w-px h-10 bg-border/60" />
            <div className="text-center lg:text-left">
              <p className="font-serif text-2xl md:text-3xl font-semibold text-primary tabular-nums">12+</p>
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-[0.15em] mt-2">Years</p>
            </div>
            <div className="w-px h-10 bg-border/60" />
            <div className="text-center lg:text-left">
              <p className="font-serif text-2xl md:text-3xl font-semibold text-primary tabular-nums">98%</p>
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-[0.15em] mt-2">Satisfaction</p>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT: Stacked Video Gallery using reusable component */}
        <motion.div
          style={{ y: isDesktop ? y2 : 0 }}
          className="relative w-full max-w-[400px] md:max-w-[480px] lg:max-w-[560px] aspect-[9/14] md:aspect-[10/9] mx-auto perspective-1000 mt-2 md:mt-8 lg:-mt-14 flex items-center justify-center p-4 overflow-hidden md:overflow-visible" // Added overflow handling for mobile
        >
          {heroItems.length > 0 ? (
            <StackedCards items={heroItems} autoplay={true} heroMode />
          ) : (
            <div className="w-full h-full bg-neutral-100/10 rounded-[2rem] animate-pulse border-4 border-white/5 flex items-center justify-center">
              <span className="font-sans text-white/20 text-sm">Loading specific moments...</span>
            </div>
          )}
        </motion.div>

      </div>

    </section>
  );
};

export default HeroSection;
