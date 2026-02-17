import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { getHeroVideos } from "@/services/contentMedia";
import { StackedCards } from "@/components/ui/stacked-cards";
import { HeroBackgroundPattern } from "@/components/ui/HeroBackgroundPattern";
import { getSiteContentByKey } from "@/services/siteContent";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [heroVideos, setHeroVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [heroContent, setHeroContent] = useState<{
    title: string;
    subtitle: string;
    description: string;
    cta_text: string;
    cta_link: string;
  } | null>(null);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);

  // Fetch Videos & Content
  useEffect(() => {
    async function fetchData() {
      try {
        const [videos, content] = await Promise.all([
          getHeroVideos(),
          getSiteContentByKey('home-hero').catch(() => null)
        ]);

        if (videos && videos.length > 0) {
          setHeroVideos(videos.map(v => v.url));
        } else {
          setHeroVideos(["/1.mp4", "/reel 1.mp4", "/3.MP4"]);
        }

        if (content) {
          setHeroContent({
            title: content.title || "Crafting Moments That Last Forever",
            subtitle: content.subtitle || "Phoenix Events & Production",
            description: content.description || "From weddings to corporate celebrations, we turn your vision into unforgettable experiences with elegance and precision.",
            cta_text: content.cta_text || "Plan Your Event",
            cta_link: content.cta_link || "/contact"
          });
        }
      } catch (error) {
        console.error("Failed to fetch hero data:", error);
        setHeroVideos(["/1.mp4", "/reel 1.mp4", "/3.MP4"]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
      className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden md:overflow-visible bg-background pt-24 pb-0 text-foreground"
      aria-label="Hero"
    >
      <HeroBackgroundPattern />

      <div className="container relative z-10 px-4 md:px-6 grid lg:grid-cols-2 gap-4 md:gap-10 lg:gap-12 items-center">

        {/* LEFT: Text Content */}
        <motion.div
          style={{ y: isDesktop ? y1 : 0 }}
          className="text-center lg:text-left space-y-6 relative z-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-primary font-sans text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              {heroContent?.subtitle || "Phoenix Events & Production"}
            </p>

            <h1 className="font-hero text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] text-foreground dark:text-white">
              {isDefaultTitle ? (
                <>
                  Crafting Moments <br />
                  That Last <br />
                  <span className="italic relative inline-block text-primary">
                    Forever
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 1, ease: "circOut" }}
                      className="absolute bottom-0 left-0 w-full h-[3px] md:h-[5px] bg-primary/40 rounded-full origin-left"
                    />
                  </span>
                </>
              ) : (
                // If custom title, simple render (maybe split by \n for breaks)
                (heroContent?.title || "").split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))
              )}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground dark:text-white/80 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            {heroContent?.description || "From weddings to corporate celebrations, we turn your vision into unforgettable experiences with elegance and precision."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2"
          >
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-warm-lg hover:shadow-warm-xl transition-all duration-300" asChild>
              <Link to={heroContent?.cta_link || "/contact"}>
                {heroContent?.cta_text || "Plan Your Event"}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 border-primary/50 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group font-medium" asChild>
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
            className="mt-8 flex items-center gap-8 justify-center lg:justify-start pt-4 border-t border-border/40"
          >
            <div className="text-center lg:text-left">
              <p className="text-2xl font-display font-semibold text-primary">500+</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5 tracking-wider uppercase">Events</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center lg:text-left">
              <p className="text-2xl font-display font-semibold text-primary">12+</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5 tracking-wider uppercase">Years</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center lg:text-left">
              <p className="text-2xl font-display font-semibold text-primary">98%</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5 tracking-wider uppercase">Satisfaction</p>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT: Stacked Video Gallery using reusable component */}
        <motion.div
          style={{ y: isDesktop ? y2 : 0 }}
          className="relative w-full max-w-[400px] md:max-w-[480px] lg:max-w-[560px] aspect-[9/14] md:aspect-[10/9] mx-auto perspective-1000 mt-2 md:mt-8 lg:-mt-14 flex items-center justify-center p-4 overflow-hidden md:overflow-visible" // Added overflow handling for mobile
        >
          {heroVideos.length > 0 ? (
            <StackedCards items={heroVideos} autoplay={true} />
          ) : (
            <div className="w-full h-full bg-neutral-100/10 rounded-[2rem] animate-pulse border-4 border-white/5 flex items-center justify-center">
              <span className="text-white/20 font-serif italic">Loading specific moments...</span>
            </div>
          )}
        </motion.div>

      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Scroll</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-primary/50 to-transparent" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
