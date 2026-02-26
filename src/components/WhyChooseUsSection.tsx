import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getWhyChooseUsReasons,
  getWhyChooseUsStats,
  type WhyChooseUsReason,
  type WhyChooseUsStat,
  type WhyChooseUsIconKey,
} from "@/services/whyChooseUs";
import { getSiteContentByKey } from "@/services/siteContent";
import {
  Trophy,
  Heart,
  Users,
  Shield,
  CheckCircle2,
} from "lucide-react";

const ICON_MAP: Record<WhyChooseUsIconKey, React.ComponentType<{ className?: string; size?: number }>> = {
  trophy: Trophy,
  heart: Heart,
  users: Users,
  shield: Shield,
};

const DEFAULT_STATS: WhyChooseUsStat[] = [
  { id: 'fb-1', stat_value: '2200+', stat_label: 'Successful Events', stat_description: 'Flawlessly executed celebrations', icon_key: 'trophy', display_order: 1, created_at: '', updated_at: '' },
  { id: 'fb-2', stat_value: '1500+', stat_label: 'Happy Couples', stat_description: 'Dream weddings brought to life', icon_key: 'heart', display_order: 2, created_at: '', updated_at: '' },
  { id: 'fb-3', stat_value: '50+', stat_label: 'Trusted Partners', stat_description: 'Premium partner network', icon_key: 'users', display_order: 3, created_at: '', updated_at: '' },
  { id: 'fb-4', stat_value: '100%', stat_label: 'Quality Assurance', stat_description: 'Commitment to excellence', icon_key: 'shield', display_order: 4, created_at: '', updated_at: '' },
];

const DEFAULT_REASONS: WhyChooseUsReason[] = [
  { id: 'fb-r1', text: 'Custom Themes Tailored to Your Vision', display_order: 1, created_at: '', updated_at: '' },
  { id: 'fb-r2', text: 'End-to-End Event Execution', display_order: 2, created_at: '', updated_at: '' },
  { id: 'fb-r3', text: 'Premium Vendor Network', display_order: 3, created_at: '', updated_at: '' },
  { id: 'fb-r4', text: 'Transparent Pricing', display_order: 4, created_at: '', updated_at: '' },
  { id: 'fb-r5', text: '24/7 Event Support', display_order: 5, created_at: '', updated_at: '' },
  { id: 'fb-r6', text: 'Post-Event Services', display_order: 6, created_at: '', updated_at: '' },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function WhyChooseUsSection() {
  const [stats, setStats] = useState<WhyChooseUsStat[]>([]);
  const [reasons, setReasons] = useState<WhyChooseUsReason[]>([]);
  const [header, setHeader] = useState<{
    title: string;
    subtitle: string;
    description: string | null;
  }>({
    title: "Why Phoenix Events?",
    subtitle: "Why Choose Us",
    description: "We create experiences that become cherished memories. With over a decade of expertise, we bring your dreams to life.",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, reasonsRes, contentRes] = await Promise.all([
          getWhyChooseUsStats(),
          getWhyChooseUsReasons(),
          getSiteContentByKey("why-us").catch(() => null),
        ]);
        setStats(statsRes.length > 0 ? statsRes : DEFAULT_STATS);
        setReasons(reasonsRes.length > 0 ? reasonsRes : DEFAULT_REASONS);
        if (contentRes) {
          setHeader({
            title: contentRes.title || header.title,
            subtitle: contentRes.subtitle || header.subtitle,
            description: contentRes.description || null,
          });
        }
      } catch {
        setStats(DEFAULT_STATS);
        setReasons(DEFAULT_REASONS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return null;

  return (
    <section
      id="why-choose-us"
      className="relative isolate z-0 py-12 md:py-14 overflow-hidden bg-transparent"
    >
      <div className="relative z-10 container px-4 mx-auto max-w-7xl">
        {/* Header – compact editorial block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1"
        >
          <span className="text-primary font-sans font-semibold tracking-[0.2em] uppercase text-xs md:text-sm">
            {header.subtitle}
          </span>
          <h2 className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground">
            {header.title}
          </h2>
          {header.description && (
            <p className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed font-sans">
              {header.description}
            </p>
          )}
        </motion.div>

        {/* Stats – compact row */}
        {stats.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-20px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10"
          >
            {stats.map((stat, idx) => {
              const Icon = ICON_MAP[stat.icon_key] ?? Trophy;
              return (
                <motion.div
                  key={stat.id}
                  variants={item}
                  className="flex items-center gap-3 rounded-xl border border-primary/40 dark:border-primary/35 bg-white/50 dark:bg-card/80 backdrop-blur-sm p-4 transition-all duration-200 hover:border-primary/60 hover:shadow-md dark:hover:shadow-card-hover-dark"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-serif font-semibold text-primary tabular-nums leading-tight">
                      {stat.stat_value}
                    </p>
                    <p className="text-xs font-semibold text-foreground font-sans truncate">{stat.stat_label}</p>
                    {stat.stat_description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 font-sans">
                        {stat.stat_description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* What Sets Us Apart – distinct panel: title + two-column checklist */}
        {reasons.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-20px" }}
            className="w-full rounded-2xl border-2 border-primary/30 dark:border-primary/25 bg-white/60 dark:bg-card/80 backdrop-blur-md overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-elevation-1-dark"
          >
            {/* Panel header */}
            <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 border-b border-primary/20 dark:border-white/10">
              <h3 className="font-serif font-medium text-foreground text-lg md:text-xl">
                What Sets Us Apart
              </h3>
              <p className="mt-1 text-sm text-muted-foreground font-sans">
                The details that make every event exceptional
              </p>
            </div>
            {/* Two-column checklist – checkmarks, no per-item cards */}
            <div className="px-5 md:px-8 py-5 md:py-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 list-none m-0 p-0">
                {reasons.map((r) => (
                  <motion.li
                    key={r.id}
                    variants={item}
                    className="flex items-center gap-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary" aria-hidden>
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>
                    <span className="font-sans text-sm md:text-base font-medium text-foreground">
                      {r.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
