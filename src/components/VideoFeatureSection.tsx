import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";

/** 3–4 videos in 3:4 ratio (user doesn’t have right ratio for one big video) */
const CRAFT_VIDEOS = ["/reel 1.mp4", "/reel 2.mp4", "/reel 3.mp4", "/reel 4.mp4"];

function CraftVideoCard({
  src,
  index,
  isPlaying,
  onToggle,
}: {
  src: string;
  index: number;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer shadow-[0_8px_24px_rgba(232,175,193,0.18)] hover:shadow-[0_12px_32px_rgba(232,175,193,0.22)] transition-shadow"
      onClick={onToggle}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-foreground/20 pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
        {!isPlaying && (
          <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center shadow-[0_0_20px_rgba(232,175,193,0.4)]">
            <Play className="h-6 w-6 text-primary-foreground ml-0.5 fill-current" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

const VideoFeatureSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.7", "end 0.3"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.6], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.3], [24, 0]);

  return (
    <section
      ref={containerRef}
      className="relative py-12 md:py-16 lg:py-20 overflow-hidden video-feature-section-bg"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        {/* Heading: Our Craft / Every Celebration Has a Story */}
        <motion.div
          style={{ opacity, y }}
          className="text-center mb-10 md:mb-12"
        >
          <p className="text-primary font-sans text-xs tracking-[0.25em] uppercase mb-2 font-medium">
            Our Craft
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-medium leading-tight text-foreground max-w-2xl mx-auto">
            Every Celebration
            <br />
            Has a <span className="italic text-primary">Story</span>
          </h2>
        </motion.div>

        {/* 3–4 videos in 2x2 grid, aspect 3:4 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
          {CRAFT_VIDEOS.slice(0, 4).map((src, index) => (
            <CraftVideoCard
              key={src}
              src={src}
              index={index}
              isPlaying={playingIndex === index}
              onToggle={() => setPlayingIndex(playingIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mt-10 md:mt-12"
        >
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Plan Your Celebration
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoFeatureSection;
