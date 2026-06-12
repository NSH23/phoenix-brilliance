import { cn } from "@/lib/utils";
import { HeroDottedRadialBackground } from "@/components/ui/hero-dotted-radial-background";
import { SectionSoftBackground } from "@/components/ui/section-soft-background";

type PageHeroBackgroundProps = {
  className?: string;
  /** `soft` = dots only; `live` = dots + faint grid */
  intensity?: "soft" | "live";
};

/** Shared inner-page hero backdrop — lighter than homepage hero. */
export function PageHeroBackground({
  className,
  intensity = "soft",
}: PageHeroBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <HeroDottedRadialBackground className="opacity-45 dark:opacity-35" spacing={26} />
      {intensity === "live" ? <SectionSoftBackground variant="grid" className="opacity-60" /> : null}
    </div>
  );
}

export default PageHeroBackground;
