import { CardCarousel } from "@/components/ui/card-carousel";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
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

          if (mapped.length < 6) {
            setReels([...mapped, ...mapped, ...mapped]);
          } else if (mapped.length < 12) {
            setReels([...mapped, ...mapped]);
          } else {
            setReels(mapped);
          }
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

  return (
    <HomeSectionShell
      id="reels-section"
      ariaLabelledBy="reels-heading"
      badge="Phoenix Reels"
      title={<HomeSectionSplitTitle line1="Moments We've" accent="Crafted" />}
      fullBleed
      contentClassName="pb-2 pt-2 md:pb-4 md:pt-4"
    >
      <CardCarousel
        images={reels}
        autoplayDelay={2500}
        showPagination={true}
        showNavigation={true}
        showHeader={false}
        fullWidth={true}
        paginationSpaced={true}
      />
    </HomeSectionShell>
  );
};

export default ReelsSection;
