import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ShuffleGrid } from "@/components/ui/shuffle-grid";
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
      className="relative pt-0 pb-8 md:pt-0 md:pb-12 -mt-8 md:-mt-12 overflow-visible bg-background z-20"
      id="about"
    >
      {/* Premium Background Glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.15),transparent_70%)] opacity-70 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full" />
      </div>

      <div className="container px-4 mx-auto relative z-30">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

          {/* Left Column: Header + Shuffle Grid – same vertical size as right */}
          <div className="order-1 flex flex-col gap-4 min-h-0">
            <div className="space-y-2 flex-shrink-0">
              {/* Eyebrow */}
              <span className="inline-block text-primary font-medium tracking-wider uppercase text-xs md:text-sm border-b border-primary/30 pb-0.5">
                {content?.subtitle || "About Us"}
              </span>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight text-foreground">
                {isDefaultTitle ? (
                  <>
                    The Art of Crafting <br />
                    <span className="text-primary italic">Unforgettable Celebrations</span>
                  </>
                ) : (
                  content?.title
                )}
              </h2>
            </div>

            <motion.div
              style={{ scale, y }}
              className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 w-full flex-1 min-h-[260px] lg:min-h-0 flex flex-col"
            >
              <div className="flex-1 min-h-[260px] lg:min-h-0 w-full relative group">
                <ShuffleGrid />

                {/* Decorative Corner Element */}
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-primary/30 rounded-br-xl z-20 pointer-events-none" />
              </div>

              {/* Background decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
            </motion.div>
          </div>

          {/* Right Column: Story Text – Kevin's story, from CMS or defaults */}
          <div className="order-2 relative flex flex-col pt-10 md:pt-16">
            <div className="space-y-6 pr-2">
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                {body.tagline}
              </p>

              {/* Desktop: always full content */}
              <div className="hidden md:block space-y-5 text-muted-foreground leading-relaxed text-base md:text-lg">
                {body.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                <div className="pl-4 border-l-2 border-primary/40 text-foreground font-medium py-1 italic text-base md:text-lg">
                  &ldquo;{body.quote}&rdquo;
                </div>
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
                      className="overflow-hidden space-y-5 text-muted-foreground leading-relaxed text-base"
                    >
                      {body.paragraphs.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                      <div className="pl-4 border-l-2 border-primary/40 text-foreground font-medium py-1 italic text-base">
                        &ldquo;{body.quote}&rdquo;
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <p className="text-muted-foreground leading-relaxed text-base line-clamp-3">
                        {body.paragraphs[0] ?? body.tagline}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setMobileExpanded((v) => !v)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
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

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
                {body.stats.map((stat, i) => (
                  <div key={i} className="space-y-0.5">
                    <h4 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{stat.value}</h4>
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
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
