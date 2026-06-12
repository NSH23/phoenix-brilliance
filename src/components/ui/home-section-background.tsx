import { cn } from "@/lib/utils";
import { PageHeroBackground } from "@/components/ui/page-hero-background";

export type HomeSectionBackgroundVariant = "vignette-grid" | "soft-mesh" | "grid-glow";

type HomeSectionBackgroundProps = {
  className?: string;
  /** Kept for call-site variety — all variants use the same hero-matched live grid stack */
  variant?: HomeSectionBackgroundVariant;
};

/**
 * Section backdrop — same visible live grid + orbs + vignette as page/home heroes.
 * Do not use on the homepage hero (use HeroEditorialBackground there).
 */
export function HomeSectionBackground({
  className,
  variant: _variant = "vignette-grid",
}: HomeSectionBackgroundProps) {
  return <PageHeroBackground intensity="live" className={className} />;
}

export default HomeSectionBackground;
