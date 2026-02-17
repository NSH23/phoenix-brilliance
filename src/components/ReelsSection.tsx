import { CardCarousel } from "@/components/ui/card-carousel";
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
            alt: item.title || `Phoenix Moment ${index + 1}`
          }));

          // Duplicate for infinite scrolling effect
          if (mapped.length < 6) {
            setReels([...mapped, ...mapped, ...mapped]);
          } else if (mapped.length < 12) {
            setReels([...mapped, ...mapped]);
          } else {
            setReels(mapped);
          }
        } else {
          // Fallback
          const fallbackSrcs = ["/4.mp4", "/5.MP4", "/6.mp4", "/7.MP4", "/1.mp4", "/reel 1.mp4"];
          const fallback = fallbackSrcs.map((src, index) => ({
            src: src,
            alt: `Phoenix Moment ${index + 1}`
          }));

          setReels([...fallback, ...fallback, ...fallback]);
        }
      } catch (error) {
        console.error("Failed to fetch reels", error);
        // Fallback (same as above)
        const fallbackSrcs = ["/4.mp4", "/5.MP4", "/6.mp4", "/7.MP4", "/1.mp4", "/reel 1.mp4"];
        const fallback = fallbackSrcs.map((src, index) => ({
          src: src,
          alt: `Phoenix Moment ${index + 1}`
        }));

        setReels([...fallback, ...fallback, ...fallback]);
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, []);

  if (loading && reels.length === 0) return null; // Or skeleton

  return (
    <section className="py-16 md:py-24 overflow-hidden relative bg-background text-foreground">


      <div className="w-full flex flex-col items-center relative z-10">

        {/* Card Carousel Component handling the section */}
        <CardCarousel
          images={reels}
          autoplayDelay={2500}
          showPagination={true}
          showNavigation={true}
          title="Moments We've Crafted"
          description="Phoenix Reel Wedding and More moments"
        />

      </div>
    </section>
  );
};

export default ReelsSection;
