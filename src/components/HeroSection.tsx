import { Link } from "react-router-dom";
import { publicGalleryHubPath } from "@/lib/publicGallery";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getHeroMedia } from "@/services/contentMedia";
import { HeroEditorialBackground } from "@/components/ui/hero-editorial-background";
import { HeroMediaShowcase } from "@/components/ui/hero-media-showcase";
import { getSiteContentByKey } from "@/services/siteContent";

const STATS = [
  { value: "500+", label: "Events" },
  { value: "12+", label: "Years" },
  { value: "98%", label: "Satisfaction" },
] as const;

const HeroSection = () => {
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

  const heroItems = (() => {
    if (heroMedia === undefined) return [];
    if (heroMedia.items?.length) return heroMedia.items;
    const items: string[] = [];
    if (heroMedia.videoUrl) items.push(heroMedia.videoUrl);
    if (heroMedia.imageUrls?.length >= 2) {
      items.push(heroMedia.imageUrls[0], heroMedia.imageUrls[1]);
    } else if (heroMedia.imageUrls?.length === 1) {
      items.push(heroMedia.imageUrls[0], heroMedia.imageUrls[0]);
    }
    return items;
  })();

  const isDefaultTitle = !heroContent || heroContent.title.includes("Crafting Moments That Last Forever");
  const description =
    heroContent?.description?.trim() ||
    "Your vision, our craft—unforgettable events across Pune.";

  return (
    <section
      className="relative isolate flex items-center overflow-visible bg-background pt-24 pb-10 dark:bg-[#0B1220] md:pb-12"
      aria-label="Hero"
    >
      <HeroEditorialBackground />

      <div className="container relative z-10 mx-auto grid max-w-7xl items-center gap-8 overflow-visible px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 xl:gap-12 [&>*]:min-w-0 [&>*]:overflow-visible">
        <div className="flex flex-col gap-6 text-center lg:gap-7 lg:text-left">
          <div className="space-y-3.5 lg:space-y-4">
            <h1 className="hero-heading-gradient font-serif text-[clamp(2.5rem,4.8vw+1rem,4rem)] font-normal leading-[1.06] tracking-[-0.02em] text-foreground">
              {isDefaultTitle ? (
                <>
                  Crafting Moments
                  <br />
                  That Last{" "}
                  <span className="italic text-primary">Forever</span>
                </>
              ) : (
                (heroContent?.title || "").split("\n").map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))
              )}
            </h1>

            <p className="mx-auto max-w-md text-[1.125rem] leading-relaxed text-muted-foreground sm:text-[1.2rem] lg:mx-0 lg:max-w-[30rem]">
              {description}
            </p>
          </div>

          <div className="mx-auto w-full max-w-lg rounded-2xl border border-border/50 bg-card/70 px-5 py-5 text-left shadow-[0_8px_30px_-12px_rgba(26,24,22,0.12)] backdrop-blur-sm sm:px-6 sm:py-6 lg:mx-0">
            <h2 className="font-serif text-[1.35rem] font-medium text-foreground sm:text-2xl">
              Kevin David
            </h2>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Founder & Creative Director
            </p>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              Since 2017, Phoenix has crafted elegant celebrations with meticulous décor, seamless
              production, and a personal touch on every project.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button size="lg" className="min-w-[12rem] gap-2 text-[1.05rem] shadow-sm" asChild>
              <Link to={heroContent?.cta_link || "/contact"}>
                {heroContent?.cta_text || "Plan Your Event"}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-[12rem] gap-2 text-[1.05rem]" asChild>
              <Link to={publicGalleryHubPath()}>
                View Our Work
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mx-auto inline-flex w-full max-w-md items-stretch justify-between gap-1 rounded-2xl border border-border/40 bg-card/50 px-2 py-3.5 sm:max-w-lg sm:px-4 lg:mx-0">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex flex-1 items-center gap-1 sm:gap-2">
                {i > 0 ? <div className="hidden h-9 w-px bg-border/80 sm:block" aria-hidden /> : null}
                <div className="flex-1 px-2 text-center sm:px-3 lg:text-left">
                  <p className="font-serif text-[1.35rem] font-semibold tabular-nums text-primary sm:text-[1.65rem]">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 overflow-visible lg:overflow-visible">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[52%] z-0 h-[78%] w-[92%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-[#1a1816]/[0.07] blur-3xl dark:bg-black/25"
          />
          <div className="relative z-[1]">
            <HeroMediaShowcase items={heroItems} isReady={heroMedia !== undefined} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
