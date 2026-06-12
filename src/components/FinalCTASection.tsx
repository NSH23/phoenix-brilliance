import { Link } from "react-router-dom";
import { publicGalleryHubPath } from "@/lib/publicGallery";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { HomeSectionBackground } from "@/components/ui/home-section-background";

const FinalCTASection = () => {
  return (
    <HomeSectionShell
      id="final-cta"
      ariaLabelledBy="final-cta-heading"
      badge="Get Started"
      title={<HomeSectionSplitTitle line1="Ready to Plan" accent="Your Celebration?" />}
      subtitle="Tell us your vision — we'll handle design, production, and flawless execution from concept to completion."
      variant="white"
      backgroundOverlay={<HomeSectionBackground variant="grid-glow" />}
    >
      <div className="flex flex-col items-start gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between md:gap-6 md:pt-7">
        <div className="max-w-xl">
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Weddings, birthdays, corporate events, and bespoke celebrations — crafted with care
            across Pune and beyond.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" className="h-11 px-8" asChild>
            <Link to="/contact">Plan Your Event</Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 px-8" asChild>
            <Link to={publicGalleryHubPath()}>
              View Our Work
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </HomeSectionShell>
  );
};

export default FinalCTASection;
