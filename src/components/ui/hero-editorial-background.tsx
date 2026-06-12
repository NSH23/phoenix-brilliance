import { cn } from "@/lib/utils";
import { HeroAmbientOrbs } from "@/components/ui/hero-ambient-orbs";
import { HeroDottedRadialBackground } from "@/components/ui/hero-dotted-radial-background";
import { HeroLiveGridBackground } from "@/components/ui/hero-live-grid-background";

type HeroEditorialBackgroundProps = {
  className?: string;
  /** When false, all layers stay visible but motion is paused (default). */
  animated?: boolean;
};

/**
 * Homepage hero backdrop — theme-aware live layers:
 * - Wavy grid field with optional traveling light pulses
 * - Radial dotted field (dotted hero pattern)
 * - Soft ambient orbs per theme
 */
export function HeroEditorialBackground({ className, animated = false }: HeroEditorialBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        !animated && "hero-editorial-bg--static",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[var(--section-band-1)] dark:bg-[#0B1220]" />

      <HeroAmbientOrbs />
      <HeroDottedRadialBackground className="opacity-70 dark:opacity-50" />
      <HeroLiveGridBackground animated={animated} />

      <div className="hero-editorial-vignette absolute inset-0" />
      <div className="hero-editorial-bg__grain absolute inset-0 hidden opacity-[0.04] dark:block dark:opacity-[0.06]" />
    </div>
  );
}

export default HeroEditorialBackground;
