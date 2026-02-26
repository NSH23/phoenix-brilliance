import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AboutFlipCards } from "@/components/ui/about-flip-cards";
import { getSiteContentByKey, parseAboutSectionDescription } from "@/services/siteContent";

export default function AboutSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [content, setContent] = useState<{
    title: string;
    subtitle: string;
    cta_text: string;
    cta_link: string;
  } | null>(null);
  const [body, setBody] = useState(parseAboutSectionDescription(null));

  useEffect(() => {
    getSiteContentByKey('about')
      .then((data) => {
        if (data) {
          setContent({
            title: data.title || "The Art of Crafting Unforgettable Celebrations",
            subtitle: data.subtitle || "About Us",
            cta_text: data.cta_text || "Read More",
            cta_link: data.cta_link || "/about",
          });
          setBody(parseAboutSectionDescription(data.description));
        }
      })
      .catch(() => {});
  }, []);

  // Parallax effect for the left image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 50]);

  // Handle potential React nodes or splitting for the title if needed,
  // but for now we assume linear text or basic HTML handling if we were using a parser.
  // The original title had a <br /> and span. We'll try to replicate that structure if it matches default.

  const isDefaultTitle = !content || content.title.includes("The Art of Crafting Unforgettable Celebrations");

  return (
    <section
      ref={containerRef}
      className="relative py-12 pb-14 md:py-16 overflow-visible bg-transparent z-20"
      id="about"
    >
      {/* Light theme: 9.jpg with soft blur. Dark theme: bg12.jpg */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-100 dark:opacity-0 pointer-events-none"
        style={{
          backgroundImage: "url('/9.jpg')",
          filter: "blur(5px)",
          transform: "scale(1.08)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-0 dark:opacity-100 pointer-events-none bg-[url('/bg12.jpg')]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-[5] bg-white/30 dark:bg-black/25"
        aria-hidden
      />
      <div className="container px-4 mx-auto relative z-30 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-10 lg:gap-16 items-stretch">

          {/* Left Column: Header + Flip Cards – styled editorial block */}
          <div className="order-1 flex flex-col gap-6 min-h-0">
            <div className="flex-shrink-0 pl-5 md:pl-6 border-l-4 border-primary/50 space-y-4 md:space-y-5 mt-6 md:mt-8">
              {/* Eyebrow – label style */}
              <span className="inline-block text-primary font-semibold tracking-[0.28em] uppercase text-xs md:text-sm font-sans text-primary/90">
                {content?.subtitle || "About Us"}
              </span>

              {/* Main Heading – editorial hierarchy */}
              <h2 className="font-serif leading-[1.15] tracking-tight text-foreground">
                {isDefaultTitle ? (
                  <>
                    <span className="block text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-light text-foreground/95">
                      The Art of Crafting
                    </span>
                    <span className="block mt-1 md:mt-1.5 text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-medium italic text-primary tracking-wide">
                      Unforgettable Celebrations
                    </span>
                  </>
                ) : (
                  content?.title
                )}
              </h2>
            </div>

            {/* Flip cards: on mobile less negative margin so they sit nicely below heading; desktop unchanged */}
            <motion.div
              style={{ scale, y }}
              className="relative w-full flex-1 min-h-[300px] md:min-h-[400px] lg:min-h-[520px] flex flex-col items-center justify-center mt-2 md:-mt-28 lg:-mt-36"
            >
              <div className="flex-1 w-full flex items-center justify-center px-1 md:px-0">
                <AboutFlipCards />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Story Text – glass/iPhone-style container (container hidden on mobile) */}
          <div className="order-2 relative flex flex-col justify-center pt-2 mt-2 md:pt-12 md:mt-0 lg:pt-0">
            <div className="space-y-6 rounded-none border-0 bg-transparent shadow-none p-0 backdrop-blur-0 md:rounded-2xl md:rounded-3xl md:border md:border-white/40 md:bg-white/20 md:p-6 md:pl-4 md:pr-4 md:backdrop-blur-xl md:shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] md:dark:bg-white/[0.08] md:dark:backdrop-blur-2xl md:dark:border-white/20 md:dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">
              {/* Desktop: full content – clear black text for visibility */}
              <div className="hidden md:block space-y-5 leading-relaxed text-base md:text-lg font-sans text-gray-900 dark:text-foreground">
                {body.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                <blockquote className="pl-5 border-l-4 border-primary/50 text-gray-900 dark:text-foreground font-serif font-medium py-2 italic text-lg md:text-xl">
                  &ldquo;{body.quote}&rdquo;
                </blockquote>
              </div>

              {/* Mobile: Read more / expandable */}
              <div className="md:hidden">
                <AnimatePresence initial={false}>
                  {mobileExpanded ? (
                    <motion.div
                      key="full"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden space-y-4 leading-relaxed text-base font-sans text-gray-900 dark:text-foreground pb-1"
                    >
                      {body.paragraphs.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                      <blockquote className="pl-4 border-l-4 border-primary/50 text-gray-900 dark:text-foreground font-serif font-medium py-2 italic text-lg">
                        &ldquo;{body.quote}&rdquo;
                      </blockquote>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <p className="text-gray-900 dark:text-foreground leading-relaxed text-base line-clamp-3 font-sans">
                        {body.paragraphs[0]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setMobileExpanded((v) => !v)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium font-sans text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
                >
                  {mobileExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Read less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Read more
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-5 mt-4 border-t border-gray-300/70 dark:border-border/60 md:pt-6 md:mt-2">
                {body.stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-xs text-gray-700 dark:text-muted-foreground uppercase tracking-[0.15em] font-sans">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
