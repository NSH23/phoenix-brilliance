import { useState, useEffect, useRef } from "react";

/** Animate a number from 0 to target when in viewport */
export default function CountUp({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  reducedMotion = false,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  reducedMotion?: boolean;
}) {
  const [count, setCount] = useState(reducedMotion ? end : 0);
  const [hasAnimated, setHasAnimated] = useState(reducedMotion);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated || reducedMotion) return;

    const start = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.floor(start + (end - start) * eased);
      setCount(value);

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [hasAnimated, end, duration, reducedMotion]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
