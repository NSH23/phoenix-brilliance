import { CardCarousel } from "@/components/ui/card-carousel";
import { MobileReelsCarousel } from "@/components/ui/mobile-reels-carousel";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { HomeSectionBackground } from "@/components/ui/home-section-background";
import { useEffect, useState } from "react";
import { getMomentsReels } from "@/services/contentMedia";

const ReelsSection = () => {
  const [reels, setReels] = useState<{ src: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReels() {
      try {
        const data = await getMomentsReels();

        if (data && data.length > 0) {
          const mapped = data.map((item, index) => ({
            src: item.url,
            alt: item.title || `Phoenix Moment ${index + 1}`,
          }));
          setReels(mapped);
        } else {
          setReels([]);
        }
      } catch (error) {
        console.error("Failed to fetch reels", error);
        setReels([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, []);

  if (loading || reels.length === 0) return null;

  const desktopReels = reels.length < 4 ? [...reels, ...reels] : reels;

  return (
    <HomeSectionShell
      id="reels-section"
      ariaLabelledBy="reels-heading"
      badge="Moments We Captured"
      title={<HomeSectionSplitTitle line1="Celebrations" accent="On Reel" />}
      subtitle="Short films from weddings, sangeets, and events we've designed and produced."
      variant="white"
      fullBleed
      contentClassName="pb-0"
      backgroundOverlay={<HomeSectionBackground variant="soft-mesh" />}
    >
      <MobileReelsCarousel reels={reels} />
      <div className="hidden md:block">
        <CardCarousel
          images={desktopReels}
          autoplayDelay={4500}
          showPagination={false}
          showNavigation={true}
          showHeader={false}
          fullWidth={true}
          paginationSpaced={false}
        />
      </div>
    </HomeSectionShell>
  );
};

export default ReelsSection;
