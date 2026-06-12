import { cn } from "@/lib/utils";
import { HeroAmbientOrbs } from "@/components/ui/hero-ambient-orbs";
import { HeroLiveGridBackground } from "@/components/ui/hero-live-grid-background";
import { SectionSoftBackground } from "@/components/ui/section-soft-background";

type PageHeroBackgroundProps = {
  className?: string;
  /** `soft` = faint CSS grid only; `live` = same wavy grid as homepage hero (static) */
  intensity?: "soft" | "live";
};

/**
 * Inner-page hero backdrop — matches homepage hero layers (orbs + grid + vignette).
 */
export function PageHeroBackground({
  className,
  intensity = "soft",
}: PageHeroBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)} aria-hidden>
      <HeroAmbientOrbs />
      {intensity === "live" ? (
        <HeroLiveGridBackground animated={false} />
      ) : (
        <SectionSoftBackground variant="grid" className="opacity-[0.35] dark:opacity-[0.28]" />
      )}
      <div className="hero-editorial-vignette absolute inset-0" />
    </div>
  );
}

export default PageHeroBackground;
