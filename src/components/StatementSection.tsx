import { useEffect, useRef, useState } from "react";

/** Large centered text block - Spoils Trophy style statement about the brand */
const StatementSection = () => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { once: true, threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="statement" className="relative py-20 sm:py-28 bg-charcoal overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <p
          ref={ref}
          className={`max-w-4xl mx-auto text-center text-ivory/95 text-body-lg sm:text-xl md:text-2xl font-medium leading-body-relaxed transition-[opacity,transform] duration-[800ms] ease-out ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Phoenix Brilliance is your trusted partner in creating extraordinary events. From intimate
          weddings to grand corporate celebrations, we bring vision to life with precision, elegance,
          and unwavering attention to detail. Every moment deserves to be unforgettable.
        </p>
      </div>
    </section>
  );
};

export default StatementSection;
