"use client";

import { Flame, Layers, Award } from "lucide-react";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { cn } from "@/lib/utils";

const JOURNEY_ITEMS: TimelineItem[] = [
  {
    id: "2017",
    title: "Phoenix Founded",
    description:
      "Kevin launched Phoenix Events with a commitment to excellence in event décor and production.",
    status: "completed",
    icon: <Flame className="h-3 w-3" />,
  },
  {
    id: "2024",
    title: "PnP Production",
    description:
      "Design and production united under one roof for cohesive, hassle-free client execution.",
    status: "completed",
    icon: <Layers className="h-3 w-3" />,
  },
  {
    id: "today",
    title: "Trusted Name",
    description:
      "Known for beautiful setups, seamless execution, and the personal touch on every project.",
    status: "active",
    icon: <Award className="h-3 w-3" />,
  },
];

type AboutJourneyTimelineProps = {
  className?: string;
};

export function AboutJourneyTimeline({ className }: AboutJourneyTimelineProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 border-l-[3px] border-primary pl-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Our Journey
        </p>
        <p className="mt-2 font-serif text-xl font-medium text-foreground md:text-2xl">
          Kevin David
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Founder & Creative Director
        </p>
      </div>

      <Timeline
        items={JOURNEY_ITEMS}
        variant="spacious"
        showTimestamps={false}
        className="mt-8 pl-1"
      />

      <blockquote className="mt-8 border-l-[3px] border-primary pl-4">
        <p className="font-serif text-lg font-medium italic leading-snug text-foreground md:text-xl">
          We design how celebrations are remembered.
        </p>
      </blockquote>
    </div>
  );
}
