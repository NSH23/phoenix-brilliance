import { cn } from "@/lib/utils";

/**
 * Soft drifting ambient orbs — subtle live depth without heavy gradients.
 */
type HeroAmbientOrbsProps = {
  className?: string;
};

export function HeroAmbientOrbs({ className }: HeroAmbientOrbsProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <span className="hero-ambient-orb hero-ambient-orb--a" />
      <span className="hero-ambient-orb hero-ambient-orb--b" />
      <span className="hero-ambient-orb hero-ambient-orb--c" />
    </div>
  );
}

export default HeroAmbientOrbs;
