import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShuffleGrid } from "@/components/ui/shuffle-grid";
import { cn } from "@/lib/utils";

export default function AboutSection() {
  const containerRef = useRef<HTMLElement>(null);

  // Parallax effect for the left image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section
      ref={containerRef}
      className="relative pt-0 pb-8 md:pt-0 md:pb-12 -mt-8 md:-mt-12 overflow-visible bg-background z-20"
      id="about"
    >
      {/* Premium Background Glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.15),transparent_70%)] opacity-70 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full" />
      </div>

      <div className="container px-4 mx-auto relative z-30">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left Column: Header + Shuffle Grid */}
          <div className="order-1 space-y-4">
            <div className="space-y-2">
              {/* Eyebrow */}
              <span className="inline-block text-primary font-medium tracking-wider uppercase text-xs md:text-sm border-b border-primary/30 pb-0.5">
                About Us
              </span>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight text-foreground">
                The Art of Crafting <br />
                <span className="text-primary italic">Unforgettable Celebrations</span>
              </h2>
            </div>

            <motion.div
              style={{ scale, y }}
              className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 w-full"
            >
              <div className="aspect-[4/3] relative group">
                <ShuffleGrid />

                {/* Decorative Corner Element */}
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-primary/30 rounded-br-xl z-20 pointer-events-none" />
              </div>

              {/* Background decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
            </motion.div>
          </div>

          {/* Right Column: Story Text */}
          <div className="order-2 relative h-full flex flex-col justify-start pt-10 md:pt-16">
            <div className="space-y-6 pr-2">
              {/* Subheading */}
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                Where vision meets emotion, and every detail becomes a memory.
              </p>

              {/* Story Copy */}
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                <p>
                  We believe that celebrations are not simply events — they are chapters in a story that deserves to be told beautifully.
                </p>
                <p>
                  Phoenix Events & Production was born from a passion for transforming ordinary spaces into extraordinary experiences. Over the years, we have curated weddings filled with emotion, corporate events driven by excellence, and celebrations that remain etched in memory long after the final applause.
                </p>
                <p>
                  From the first consultation to the final spotlight, every detail is intentional. Every element is designed to reflect your personality, your vision, and your story.
                </p>

                <div className="pl-4 border-l-2 border-primary/40 text-foreground font-medium py-1 italic text-base md:text-lg">
                  "We do not just plan events. <br /> We design how they are remembered."
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-0.5">
                  <h4 className="text-2xl md:text-3xl font-serif font-bold text-foreground">500+</h4>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Events Curated</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-2xl md:text-3xl font-serif font-bold text-foreground">12+</h4>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Years of Excellence</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-2xl md:text-3xl font-serif font-bold text-foreground">50+</h4>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Premium Partners</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-2xl md:text-3xl font-serif font-bold text-foreground">98%</h4>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Client Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
