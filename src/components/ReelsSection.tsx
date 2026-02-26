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
    <section
      id="reels-section"
      className="relative pt-16 md:pt-20 pb-0 md:pb-1 mb-[-1rem] md:mb-[-1.5rem] overflow-hidden bg-transparent text-foreground"
      aria-labelledby="reels-heading"
    >
      {/* Section header – same position as About Us (container + max-w-7xl) */}
      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        <header className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1">
          <p className="text-primary font-sans font-semibold text-xs md:text-sm tracking-[0.2em] uppercase">
            Phoenix Reels
          </p>
          <h2 id="reels-heading" className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground">
            Moments We&apos;ve Crafted
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed font-sans">
            Wedding and more moments — captured and shared.
          </p>
        </header>
      </div>

      {/* Reels container: full width, edge to edge – ensure above section background */}
      <div className="w-full px-0 relative z-10">
        <CardCarousel
          images={reels}
          autoplayDelay={2500}
          showPagination={true}
          showNavigation={true}
          showHeader={false}
          fullWidth={true}
          paginationSpaced={true}
        />
      </div>
    </section>
  );
};

export default ReelsSection;
