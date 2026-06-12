import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HERO_STACK_PLACEHOLDER, StackedCards } from "@/components/ui/stacked-cards";

export const HERO_STACK_SLOT_COUNT = 3;

/** Always render three stack slots; empty slots use a placeholder sentinel. */
export function padHeroStackItems(items: string[]): string[] {
  const valid = items.filter((url) => typeof url === "string" && url.trim().length > 0);
  const slots = [...valid];
  while (slots.length < HERO_STACK_SLOT_COUNT) {
    slots.push(HERO_STACK_PLACEHOLDER);
  }
  return slots.slice(0, HERO_STACK_SLOT_COUNT);
}

type HeroMediaShowcaseProps = {
  items: string[];
  /** False while hero media is still fetching */
  isReady?: boolean;
  className?: string;
};

function HeroMediaPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex aspect-[10/11] w-full max-w-[340px] items-center justify-center overflow-hidden rounded-[1.65rem] border border-dashed border-border/80 bg-muted/25 sm:max-w-[380px]",
        className,
      )}
    >
      <div className="relative h-[72%] w-[68%]">
        <div
          aria-hidden
          className="absolute inset-0 rounded-[1.25rem] border border-border/50 bg-muted/40 shadow-sm"
        />
        <div
          aria-hidden
          className="absolute -left-[18%] top-[6%] h-[88%] w-[88%] rounded-[1.15rem] border border-border/40 bg-muted/30"
          style={{ transform: "rotate(-5deg)" }}
        />
        <div
          aria-hidden
          className="absolute -right-[18%] top-[6%] h-[88%] w-[88%] rounded-[1.15rem] border border-border/40 bg-muted/30"
          style={{ transform: "rotate(5deg)" }}
        />
        <p className="absolute inset-x-0 bottom-[-2.25rem] text-center text-xs text-muted-foreground">
          Hero media will appear here
        </p>
      </div>
    </div>
  );
}

export function HeroMediaShowcase({ items, isReady = true, className }: HeroMediaShowcaseProps) {
  const validItems = items.filter((url) => typeof url === "string" && url.trim().length > 0);

  if (!isReady) {
    return (
      <div
        className={cn(
          "mx-auto flex aspect-[10/11] w-full max-w-[340px] items-center justify-center rounded-[1.65rem] border border-dashed border-border bg-muted/20 sm:max-w-[380px]",
          className,
        )}
      >
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (validItems.length === 0) {
    return <HeroMediaPlaceholder className={className} />;
  }

  const stackItems = padHeroStackItems(validItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "mx-auto w-full max-w-[400px] overflow-visible px-8 sm:max-w-[460px] sm:px-10 lg:max-w-[520px] lg:px-12",
        className,
      )}
    >
      <div className="overflow-visible rounded-[2rem] border border-border/60 bg-border/20 p-2 shadow-[0_18px_44px_-16px_rgba(26,24,22,0.22)]">
        <div className="relative aspect-[10/11] w-full overflow-visible rounded-[1.65rem]">
          <StackedCards items={stackItems} autoplay heroMode cycleOnEnd editorial />
        </div>
      </div>
    </motion.div>
  );
}

export default HeroMediaShowcase;
