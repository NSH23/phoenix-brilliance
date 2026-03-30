import { useEffect, useRef, useState, type ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

/**
 * Section heading with scroll reveal animation — luxury detail, no over-dramatic motion.
 */
export default function SectionHeading({ children, className = "", as: Tag = "h2" }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { once: true, rootMargin: "-10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Tag
        className={`${className} transition-[opacity,transform] duration-[550ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {children}
      </Tag>
    </div>
  );
}
