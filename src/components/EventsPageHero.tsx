import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HomeSectionSplitTitle } from "@/components/ui/home-section-split-title";
import { HomeSectionHeader } from "@/components/ui/home-section-header";
import { cn } from "@/lib/utils";
import { PageHeroBackground } from "@/components/ui/page-hero-background";

export type EventsPageHeroProps = {
  eyebrow?: string;
  description?: string;
  eventTypeCount: number;
  albumCount: number;
  photoCount: number;
  className?: string;
};

export default function EventsPageHero({
  eyebrow = "Our Events",
  description = "Explore our event galleries — weddings, birthdays, corporate events and more.",
  eventTypeCount,
  albumCount,
  photoCount,
  className,
}: EventsPageHeroProps) {
  const stats = [
    {
      value: eventTypeCount,
      label: eventTypeCount === 1 ? "event type" : "event types",
      show: eventTypeCount > 0,
    },
    {
      value: albumCount,
      label: albumCount === 1 ? "album" : "albums",
      show: albumCount > 0,
    },
    {
      value: photoCount,
      label: photoCount === 1 ? "photo" : "photos",
      show: photoCount > 0,
    },
  ].filter((s) => s.show);

  return (
    <section className={cn("relative overflow-hidden bg-background pb-10 pt-24 md:pb-12 md:pt-28", className)}>
      <PageHeroBackground intensity="live" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_10%_0%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,hsl(var(--primary)/0.08),transparent_50%)] dark:block"
      />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <HomeSectionHeader
            badge={eyebrow}
            title={<HomeSectionSplitTitle line1="Choose Your" accent="Celebration" />}
            subtitle={description}
            headingLevel="h1"
          />

          {stats.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm"
                >
                  <span className="font-semibold tabular-nums text-foreground">{value}</span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-6 text-sm text-muted-foreground">
            Don&apos;t see your event?{" "}
            <Link
              to="/contact"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Get in touch
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
