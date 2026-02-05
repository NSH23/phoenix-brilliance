import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Trophy, Heart, Users, Shield, Star } from "lucide-react";
import { getWhyChooseUsStats, getWhyChooseUsReasons } from "@/services/whyChooseUs";
import { getSiteContentByKey } from "@/services/siteContent";

const ICON_MAP: Record<string, typeof Trophy> = { trophy: Trophy, heart: Heart, users: Users, shield: Shield };

const DEFAULT_STATS = [
  { icon: Trophy, value: "100+", label: "Successful Events", description: "Flawlessly executed celebrations" },
  { icon: Heart, value: "50+", label: "Happy Couples", description: "Dream weddings brought to life" },
  { icon: Users, value: "25+", label: "Trusted Vendors", description: "Premium partner network" },
  { icon: Shield, value: "100%", label: "Quality Assurance", description: "Commitment to excellence" },
];

const DEFAULT_REASONS = [
  "Custom Themes Tailored to Your Vision",
  "End-to-End Event Execution",
  "Premium Vendor Network",
  "Transparent Pricing",
  "24/7 Event Support",
  "Post-Event Services",
];

const WhyUsSection = () => {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [reasons, setReasons] = useState<string[]>(DEFAULT_REASONS);
  const [header, setHeader] = useState({ title: "Why Phoenix Events?", subtitle: "Why Choose Us", description: "We create experiences that become cherished memories." });

  useEffect(() => {
    Promise.all([getWhyChooseUsStats(), getWhyChooseUsReasons(), getSiteContentByKey("why-us").catch(() => null)])
      .then(([s, r, h]) => {
        if (s?.length) setStats(s.map((x) => ({ icon: ICON_MAP[x.icon_key] || Trophy, value: x.stat_value, label: x.stat_label, description: x.stat_description || "" })));
        if (r?.length) setReasons(r.map((x) => x.text));
        if (h) setHeader({ title: h.title || header.title, subtitle: h.subtitle || header.subtitle, description: h.description || header.description });
      })
      .catch(() => {});
  }, []);

  return (
    <section id="why-us" className="py-16 sm:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-emerald/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            {header.subtitle}
          </span>
          <h2 className="section-title mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl">
            {header.title}
          </h2>
          <p className="section-subtitle text-sm sm:text-base max-w-lg mx-auto">
            {header.description}
          </p>
        </motion.div>

        {/* Stats Grid - Instagram-style on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group"
            >
              <div className="glass-card p-4 sm:p-5 lg:p-6 text-center h-full transition-all duration-500
                            hover:shadow-luxury hover:-translate-y-2
                            active:scale-[0.98] sm:active:scale-100">
                {/* Icon - Compact on mobile */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto rounded-xl sm:rounded-2xl 
                              bg-gradient-to-br from-primary/20 to-rose-gold/10 
                              flex items-center justify-center mb-2.5 sm:mb-3 lg:mb-4
                              group-hover:from-primary group-hover:to-rose-gold 
                              group-hover:scale-105 transition-all duration-500">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary 
                                      group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Value - Large number on mobile */}
                <motion.div
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 + 0.2 }}
                  className="font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gradient-gold mb-1 sm:mb-2"
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1 line-clamp-1">
                  {stat.label}
                </h3>
                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground line-clamp-1">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reasons List - Horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Mobile: Horizontal scroll */}
          <div className="sm:hidden">
            <h3 className="font-serif text-lg font-bold text-center text-foreground mb-4">
              What Sets Us Apart
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {reasons.map((reason, index) => (
                <motion.div
                  key={reason}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl 
                           bg-gradient-to-r from-primary/10 to-rose-gold/5 
                           border border-primary/20 min-w-[200px]
                           active:scale-95 transition-transform"
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Star className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium text-sm">{reason}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:block glass-card p-6 md:p-8 lg:p-12">
            <h3 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-6 lg:mb-8">
              What Sets Us Apart
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              {reasons.map((reason, index) => (
                <motion.div
                  key={reason}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium text-sm lg:text-base">{reason}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUsSection;
