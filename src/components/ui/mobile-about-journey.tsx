import { AnimatePresence, motion } from "framer-motion";
import { Award, ChevronDown, ChevronUp, Flame, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AboutSectionContent } from "@/services/siteContent";

const JOURNEY_STEPS = [
  {
    id: "2017",
    year: "2017",
    title: "Phoenix Founded",
    description:
      "Kevin launched Phoenix Events with a commitment to excellence in event décor and production.",
    icon: Flame,
  },
  {
    id: "2024",
    year: "2024",
    title: "PnP Production",
    description:
      "Design and production united under one roof for cohesive, hassle-free client execution.",
    icon: Layers,
  },
  {
    id: "today",
    year: "Today",
    title: "Trusted Name",
    description:
      "Known for beautiful setups, seamless execution, and the personal touch on every project.",
    icon: Award,
  },
] as const;

type MobileAboutJourneyProps = {
  body: AboutSectionContent;
  expanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
};

export function MobileAboutJourney({
  body,
  expanded,
  onToggleExpanded,
  className,
}: MobileAboutJourneyProps) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-4 text-center shadow-sm backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Our Journey</p>
        <h3 className="mt-2 font-serif text-xl font-medium text-foreground">Kevin David</h3>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Founder & Creative Director
        </p>
      </div>

      <div className="space-y-3">
        {JOURNEY_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="relative flex gap-3 rounded-2xl border border-border/50 bg-background/70 px-3.5 py-3.5 shadow-sm"
            >
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                {index < JOURNEY_STEPS.length - 1 ? (
                  <div className="h-full min-h-[12px] w-px bg-border/80" aria-hidden />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{step.year}</p>
                <p className="mt-0.5 font-serif text-base font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <blockquote className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3.5 text-center">
        <p className="font-serif text-base font-medium italic leading-snug text-foreground">
          &ldquo;We design how celebrations are remembered.&rdquo;
        </p>
      </blockquote>

      <div className="rounded-2xl border border-border/50 bg-card/60 px-4 py-4">
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.div
              key="full"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-3 overflow-hidden"
            >
              {body.paragraphs.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90">
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
              className="line-clamp-3 text-sm leading-relaxed text-foreground/90"
            >
              {body.paragraphs[0]}
            </motion.p>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          {expanded ? (
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
        <blockquote className="border-l-[3px] border-primary/70 pl-4">
          <p className="font-serif text-base font-medium italic leading-snug text-foreground">
            &ldquo;{body.quote}&rdquo;
          </p>
        </blockquote>
      ) : null}

      {body.stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {body.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 text-center shadow-sm"
            >
              <p className="font-serif text-xl font-semibold tabular-nums text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default MobileAboutJourney;
