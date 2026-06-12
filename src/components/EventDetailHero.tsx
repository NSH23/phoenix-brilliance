import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { HomeSectionSplitTitle } from "@/components/ui/home-section-split-title";
import { HomeSectionHeader } from "@/components/ui/home-section-header";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { PageHeroBackground } from "@/components/ui/page-hero-background";
import { cn } from "@/lib/utils";

export type EventDetailHeroProps = {
  title: string;
  description: string;
  coverSrc: string;
  albumCount: number;
  photoCount: number;
  className?: string;
};

function getDisplayDescription(description: string, maxLen = 220): string {
  const trimmed = description.trim();
  if (!trimmed) return "";
  return trimmed.length <= maxLen ? trimmed : `${trimmed.slice(0, maxLen - 1)}…`;
}

export default function EventDetailHero({
  title,
  description,
  coverSrc,
  albumCount,
  photoCount,
  className,
}: EventDetailHeroProps) {
  const displayDescription = getDisplayDescription(description);
  const stats = [
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
    <section className={cn("relative isolate overflow-hidden bg-background pb-8 pt-24 md:pb-10 md:pt-28", className)}>
      <PageHeroBackground intensity="live" />

      <div className="container relative z-10 mx-auto px-4">
        <Link
          to="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All events
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex min-w-0 flex-col"
          >
            <HomeSectionHeader
              badge="Event gallery"
              title={<HomeSectionSplitTitle line1={title} accent="Albums" />}
              subtitle={displayDescription || undefined}
              headingLevel="h1"
            />

            {stats.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3 pl-5 md:pl-6">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:sticky lg:top-28"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <AspectRatio ratio={4 / 3} className="bg-muted">
                <OptimizedImage
                  src={coverSrc}
                  alt={title}
                  preset="banner"
                  loading="eager"
                  className="h-full w-full object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
                  aria-hidden
                />
              </AspectRatio>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
