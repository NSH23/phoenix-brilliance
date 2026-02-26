import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedVideoOnScrollProps {
  videoSrc: string;
  className?: string;
}

const AnimatedVideoOnScroll = ({
  videoSrc,
  className,
}: AnimatedVideoOnScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "end 0.4"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.4, 0.7], [0.88, 0.98, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.4, 0.7], [24, 16, 12]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.7, 1]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div
        style={{
          scale,
          borderRadius,
          opacity,
        }}
        className="relative overflow-hidden shadow-[0_8px_60px_-12px_hsl(var(--primary)/0.15)] border border-divider"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/40 z-10" />

        <div className="relative aspect-video w-full">
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AnimatedVideoOnScroll;

