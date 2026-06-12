import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HomeSectionSplitTitle } from "@/components/ui/home-section-split-title";
import { HomeSectionHeader } from "@/components/ui/home-section-header";
import { cn } from "@/lib/utils";
import { PageHeroBackground } from "@/components/ui/page-hero-background";

export type VenuesPageHeroProps = {
  eyebrow?: string;
  description?: string;
  venueCount: number;
  className?: string;
};

export default function VenuesPageHero({
  eyebrow = "Partner venues",
  description = "Discover our curated network of premium venues across Pune — perfect for weddings, corporate gatherings, and milestone celebrations.",
  venueCount,
  className,
}: VenuesPageHeroProps) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-background pb-10 pt-24 md:pb-12 md:pt-28", className)}>
      <PageHeroBackground intensity="live" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <HomeSectionHeader
            badge={eyebrow}
            title={<HomeSectionSplitTitle line1="Elegant" accent="Venues" />}
            subtitle={description}
            headingLevel="h1"
          />

          {venueCount > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/90 px-3.5 py-2 text-sm shadow-sm backdrop-blur-sm">
                <span className="font-semibold tabular-nums text-foreground">{venueCount}</span>
                <span className="text-muted-foreground">
                  {venueCount === 1 ? "venue" : "venues"} in Pune
                </span>
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-sm text-muted-foreground">
            Need help choosing?{" "}
            <Link
              to="/contact"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Talk to our team
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
