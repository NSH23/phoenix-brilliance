import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

const headingVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] as const } },
};

/**
 * Section heading with scroll reveal animation — luxury detail, no over-dramatic motion.
 */
export default function SectionHeading({ children, className = "", as: Tag = "h2" }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  const MotionHeading = Tag === "h1" ? motion.h1 : Tag === "h3" ? motion.h3 : motion.h2;

  return (
    <div ref={ref}>
      <MotionHeading
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={headingVariants}
        className={className}
      >
        {children}
      </MotionHeading>
    </div>
  );
}
