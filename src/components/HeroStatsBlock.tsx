import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Trophy, Heart, Handshake, Shield, type LucideIcon } from "lucide-react";
import CountUp from "./CountUp";
import { getWhyChooseUsStats, type WhyChooseUsStat } from "@/services/whyChooseUs";

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  heart: Heart,
  users: Handshake,
  shield: Shield,
};

const DEFAULT_STATS = [
  { value: 2200, suffix: "+", label: "Successful Events", iconKey: "trophy" as const },
  { value: 1500, suffix: "+", label: "Happy Couples", iconKey: "heart" as const },
  { value: 100, suffix: "%", label: "Quality Assurance", iconKey: "shield" as const },
];

function parseStatValue(statValue: string): { value: number; suffix: string } {
  const match = statValue.trim().match(/^(\d+)(.*)$/);
  if (!match) return { value: 0, suffix: "" };
  return {
    value: parseInt(match[1], 10),
    suffix: match[2]?.trim() ?? "",
  };
}

type DisplayStat = { value: number; suffix: string; label: string; Icon: LucideIcon };

function toDisplayStats(raw: WhyChooseUsStat[]): DisplayStat[] {
  const byKey = new Map(raw.map((s) => [s.icon_key, s]));
  return DEFAULT_STATS.map((d) => {
    const row = byKey.get(d.iconKey);
    const Icon = ICON_MAP[d.iconKey] ?? Trophy;
    if (row) {
      const { value, suffix } = parseStatValue(row.stat_value);
      return { value, suffix, label: row.stat_label, Icon };
    }
    return {
      value: d.value,
      suffix: d.suffix,
      label: d.label,
      Icon,
    };
  });
}

/** Stats overlay: equal-height cards with icon, number, label (no podium bar) */
const HeroStatsBlock = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const reducedMotion = useReducedMotion();
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState<DisplayStat[]>(() =>
    DEFAULT_STATS.map((d) => ({
      ...d,
      Icon: ICON_MAP[d.iconKey] ?? Trophy,
    }))
  );

  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Always use the hardcoded stats - don't fetch from database
  // The user wants: 2200+ Successful Events, 1500+ Happy Couples, 100% Quality Assurance
  useEffect(() => {
    // Set stats directly from DEFAULT_STATS - ignore database
    setStats(
      DEFAULT_STATS.map((d) => ({
        value: d.value,
        suffix: d.suffix,
        label: d.label,
        Icon: ICON_MAP[d.iconKey] ?? Trophy,
      }))
    );
  }, []);

  return (
    <div
      ref={sectionRef}
      id="stats"
      role="region"
      aria-label="Statistics"
      className="relative z-10 w-full max-w-4xl mx-auto px-4 -mt-16 sm:-mt-20"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" role="list">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            role="listitem"
            aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: reducedMotion ? 0 : 0.5,
              delay: reducedMotion ? 0 : 0.08 * index,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="group relative flex flex-col rounded-xl border dark:border-white/10 bg-card/95 dark:bg-black/60 backdrop-blur-md py-4 px-3 sm:py-5 sm:px-4 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary/30 dark:focus-within:ring-white/30 focus-within:ring-offset-2 focus-within:ring-offset-transparent hero-stats"
            style={{
              border: isDark 
                ? undefined 
                : '1px solid rgba(212, 175, 55, 0.1)',
              background: isDark
                ? undefined
                : 'rgba(255, 255, 255, 0.6)',
              boxShadow: isDark
                ? undefined
                : '0 4px 16px rgba(42, 34, 25, 0.06)'
            }}
            onMouseEnter={(e) => {
              if (!isDark) {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(42, 34, 25, 0.12), 0 4px 12px rgba(212, 175, 55, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDark) {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(42, 34, 25, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.1)';
              }
            }}
          >
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg dark:bg-white/10 flex items-center justify-center mb-2 flex-shrink-0"
              style={{
                background: isDark
                  ? undefined
                  : 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: isDark
                  ? undefined
                  : '2px solid rgba(212, 175, 55, 0.2)'
              }}
            >
              <stat.Icon 
                className="w-5 h-5 sm:w-6 sm:h-6 dark:text-white" 
                style={{
                  color: isDark ? undefined : '#D4AF37'
                }}
                strokeWidth={2} 
              />
            </div>
            <p 
              className="text-2xl sm:text-3xl font-bold dark:text-white leading-none tabular-nums"
              style={{
                color: isDark ? undefined : '#2A2219'
              }}
            >
              <CountUp
                end={stat.value}
                suffix={stat.suffix}
                duration={2000}
                reducedMotion={!!reducedMotion}
              />
            </p>
            <p 
              className="text-xs sm:text-sm font-medium dark:text-white/80 mt-1"
              style={{
                color: isDark ? undefined : '#4A3F35'
              }}
            >
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HeroStatsBlock;
