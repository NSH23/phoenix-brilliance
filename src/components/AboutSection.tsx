import { useState, useEffect } from "react";
import { AboutJourneyTimeline } from "@/components/ui/about-journey-timeline";
import { MobileAboutJourney } from "@/components/ui/mobile-about-journey";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { HomeSectionBackground } from "@/components/ui/home-section-background";
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
      backgroundOverlay={<HomeSectionBackground variant="grid-glow" />}
    >
      <div className="md:hidden">
        <MobileAboutJourney
          body={body}
          expanded={mobileExpanded}
          onToggleExpanded={() => setMobileExpanded((v) => !v)}
        />
      </div>

      <div className="hidden md:grid md:items-start md:gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <AboutJourneyTimeline className="lg:pr-4" />

        <div className="flex min-w-0 flex-col border-l border-border pl-0 lg:pl-10">
          <div className="flex h-full flex-col">
            <div className="space-y-4">
              {body.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed text-foreground/90 md:text-base md:leading-7"
                >
                  {para}
                </p>
              ))}
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
