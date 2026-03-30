import { useRef, useState, useEffect } from "react";
import { Trophy, Heart, Handshake, Shield, type LucideIcon } from "lucide-react";
import CountUp from "./CountUp";


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

type DisplayStat = { value: number; suffix: string; label: string; Icon: LucideIcon };



/** Stats overlay: equal-height cards with icon, number, label (no podium bar) */
const HeroStatsBlock = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState<DisplayStat[]>(() =>
    DEFAULT_STATS.map((d) => ({
      ...d,
      Icon: ICON_MAP[d.iconKey] ?? Trophy,
    }))
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { once: true, rootMargin: "-50px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
          <div
            key={stat.label}
            role="listitem"
            aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
            className="group relative flex flex-col rounded-xl border dark:border-white/10 py-4 px-3 sm:py-5 sm:px-4 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary/30 dark:focus-within:ring-white/30 focus-within:ring-offset-2 focus-within:ring-offset-transparent hero-stats dark:bg-black/60 dark:backdrop-blur-md"
            style={{
              border: isDark
                ? undefined
                : '1px solid hsl(var(--primary) / 0.15)',
              background: isDark
                ? undefined
                : 'linear-gradient(135deg, rgba(255,251,248,0.95) 0%, rgba(255,245,240,0.92) 100%)',
              boxShadow: isDark
                ? undefined
                : '0 4px 20px rgba(232, 175, 193, 0.18)',
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(24px)',
              transitionProperty: 'opacity, transform',
              transitionDuration: reducedMotion ? '0ms' : '500ms',
              transitionDelay: reducedMotion ? '0ms' : `${0.08 * index}s`,
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onMouseEnter={(e) => {
              if (!isDark) {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(232, 175, 193, 0.24), 0 4px 12px hsl(var(--primary) / 0.12)';
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.22)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDark) {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(232, 175, 193, 0.18)';
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.15)';
              }
            }}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg dark:bg-white/10 flex items-center justify-center mb-2 flex-shrink-0"
              style={{
                background: isDark
                  ? undefined
                  : 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.06) 100%)',
                border: isDark
                  ? undefined
                  : '2px solid hsl(var(--primary) / 0.22)'
              }}
            >
              <stat.Icon
                className="w-5 h-5 sm:w-6 sm:h-6 dark:text-white"
                style={{
                  color: isDark ? undefined : 'hsl(var(--primary))'
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroStatsBlock;
