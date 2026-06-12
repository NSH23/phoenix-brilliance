import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AboutJourneyTimeline } from "@/components/ui/about-journey-timeline";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { SectionSoftBackground } from "@/components/ui/section-soft-background";
import { getSiteContentByKey, parseAboutSectionDescription } from "@/services/siteContent";

const DEFAULT_TITLE_MARKER = "The Art of Crafting Unforgettable Celebrations";

export default function AboutSection() {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [content, setContent] = useState<{
    title: string;
    subtitle: string;
    cta_text: string;
    cta_link: string;
  } | null>(null);
  const [body, setBody] = useState(parseAboutSectionDescription(null));

  useEffect(() => {
    getSiteContentByKey("about")
      .then((data) => {
        if (data) {
          setContent({
            title: data.title || DEFAULT_TITLE_MARKER,
            subtitle: data.subtitle || "About Us",
            cta_text: data.cta_text || "Read More",
            cta_link: data.cta_link || "/about",
          });
          setBody(parseAboutSectionDescription(data.description));
        }
      })
      .catch(() => {});
  }, []);

  const isDefaultTitle = !content || content.title.includes(DEFAULT_TITLE_MARKER);

  const titleNode = isDefaultTitle ? (
    <HomeSectionSplitTitle line1="The Art of Crafting" accent="Unforgettable Celebrations" />
  ) : (
    content?.title
  );

  return (
    <HomeSectionShell
      ariaLabelledBy="about-heading"
      badge={content?.subtitle || "About Us"}
      title={titleNode}
      subtitle={body.tagline}
      variant="linen"
      contentClassName="pt-0"
      backgroundOverlay={<SectionSoftBackground variant="grid" />}
    >
      <div className="grid items-start gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <AboutJourneyTimeline className="lg:pr-4" />

        <div className="flex min-w-0 flex-col border-l border-border pl-0 lg:pl-10">
          <div className="flex h-full flex-col">
            {/* Desktop: full story */}
            <div className="hidden space-y-4 md:block">
              {body.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed text-foreground/90 md:text-base md:leading-7"
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Mobile: expandable preview */}
            <div className="md:hidden">
              <AnimatePresence initial={false} mode="wait">
                {mobileExpanded ? (
                  <motion.div
                    key="full"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-4 overflow-hidden"
                  >
                    {body.paragraphs.map((para, i) => (
                      <p key={i} className="text-[15px] leading-relaxed text-foreground/90">
                        {para}
                      </p>
                    ))}
                  </motion.div>
                ) : (
                  <motion.p
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="line-clamp-4 text-[15px] leading-relaxed text-foreground/90"
                  >
                    {body.paragraphs[0]}
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => setMobileExpanded((v) => !v)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {mobileExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" aria-hidden />
                    Read less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                    Read more
                  </>
                )}
              </button>
            </div>

            {body.quote ? (
              <blockquote className="relative mt-6 border-l-[3px] border-primary/70 pl-4 md:mt-7 md:pl-5">
                <p className="font-serif text-lg font-medium italic leading-snug text-foreground md:text-xl md:leading-relaxed">
                  &ldquo;{body.quote}&rdquo;
                </p>
              </blockquote>
            ) : null}

            {body.stats.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/50 pt-6 sm:grid-cols-4 md:mt-7 md:gap-4 md:pt-7">
                {body.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/50 bg-background/60 px-3.5 py-3 text-center shadow-sm dark:bg-background/40 sm:text-left"
                  >
                    <p className="font-serif text-2xl font-semibold tabular-nums text-foreground md:text-[1.65rem]">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </HomeSectionShell>
  );
}
