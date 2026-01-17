import { motion } from "framer-motion";
import { Trophy, Heart, Users, Shield, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  {
    icon: Trophy,
    value: 100,
    suffix: "+",
    label: "Successful Events",
    description: "Flawlessly executed celebrations",
  },
  {
    icon: Heart,
    value: 50,
    suffix: "+",
    label: "Happy Couples",
    description: "Dream weddings brought to life",
  },
  {
    icon: Users,
    value: 25,
    suffix: "+",
    label: "Trusted Vendors",
    description: "Premium partner network",
  },
  {
    icon: Shield,
    value: 100,
    suffix: "%",
    label: "Quality Assurance",
    description: "Commitment to excellence",
  },
];

// Counter component with animation
const AnimatedCounter = ({ value, suffix, delay = 0 }: { value: number; suffix: string; delay?: number }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            // Animate from 0 to value
            const duration = 2000; // 2 seconds
            const steps = 60;
            const increment = value / steps;
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= value) {
                setCount(value);
                clearInterval(timer);
              } else {
                setCount(Math.floor(current));
              }
            }, duration / steps);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gradient-gold mb-1 sm:mb-2">
      {count}{suffix}
    </div>
  );
};

const reasons = [
  "Custom Themes Tailored to Your Vision",
  "End-to-End Event Execution",
  "Premium Vendor Network",
  "Transparent Pricing",
  "24/7 Event Support",
  "Post-Event Services",
];

const WhyUsSection = () => {
  return (
    <section id="why-us" className="py-16 sm:py-20 lg:py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-rose-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Section Header - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-12 lg:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Why Choose Us
          </span>
          <h2 className="section-title mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            Why <span className="text-gradient-gold">Phoenix Events?</span>
          </h2>
          <p className="section-subtitle text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            We create experiences that become cherished memories.
          </p>
        </motion.div>

        {/* Stats Grid - Improved layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group"
            >
              <div className="glass-card p-5 sm:p-6 lg:p-8 text-center h-full transition-all duration-500
                            hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1
                            active:scale-[0.98] sm:active:scale-100 border border-border/50">
                {/* Icon - Enhanced */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto rounded-2xl 
                              bg-gradient-to-br from-primary/20 via-primary/10 to-rose-gold/10 
                              flex items-center justify-center mb-4 sm:mb-5 lg:mb-6
                              group-hover:from-primary group-hover:to-rose-gold 
                              group-hover:scale-110 group-hover:shadow-lg transition-all duration-500">
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-primary 
                                      group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Value - Large number with animation */}
                <div className="mb-2 sm:mb-3">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} delay={index * 0.08} />
                </div>

                {/* Label */}
                <h3 className="font-semibold text-foreground text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">
                  {stat.label}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyUsSection;
