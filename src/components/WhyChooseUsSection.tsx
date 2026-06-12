import { useState, useEffect } from "react";
import {
  getWhyChooseUsReasons,
  getWhyChooseUsStats,
  type WhyChooseUsReason,
  type WhyChooseUsStat,
} from "@/services/whyChooseUs";
import { getSiteContentByKey } from "@/services/siteContent";
import type { SiteContent } from "@/services/siteContent";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { HomeSectionBackground } from "@/components/ui/home-section-background";

const DEFAULT_STATS: WhyChooseUsStat[] = [
  { id: 'fb-1', stat_value: '2200+', stat_label: 'Successful Events', stat_description: 'Flawlessly executed celebrations', icon_key: 'trophy', display_order: 1, created_at: '', updated_at: '' },
  { id: 'fb-2', stat_value: '1500+', stat_label: 'Happy Couples', stat_description: 'Dream weddings brought to life', icon_key: 'heart', display_order: 2, created_at: '', updated_at: '' },
  { id: 'fb-3', stat_value: '50+', stat_label: 'Trusted Partners', stat_description: 'Premium partner network', icon_key: 'users', display_order: 3, created_at: '', updated_at: '' },
  { id: 'fb-4', stat_value: '100%', stat_label: 'Quality Assurance', stat_description: 'Commitment to excellence', icon_key: 'shield', display_order: 4, created_at: '', updated_at: '' },
];

const DEFAULT_WHY_HEADER = {
  title: "Why Phoenix Events?",
  subtitle: "Why Choose Us",
  description:
    "We craft experiences that transcend moments and become cherished memories. With over a decade of expertise, we transform visions into beautifully executed realities.",
};

const DEFAULT_REASONS: WhyChooseUsReason[] = [
  { id: 'fb-r1', text: 'Custom Themes Tailored to Your Vision', display_order: 1, created_at: '', updated_at: '' },
  { id: 'fb-r2', text: 'End-to-End Event Execution', display_order: 2, created_at: '', updated_at: '' },
  { id: 'fb-r3', text: 'Premium Vendor Network', display_order: 3, created_at: '', updated_at: '' },
  { id: 'fb-r4', text: 'Transparent Pricing', display_order: 4, created_at: '', updated_at: '' },
  { id: 'fb-r5', text: '24/7 Event Support', display_order: 5, created_at: '', updated_at: '' },
  { id: 'fb-r6', text: 'Post-Event Services', display_order: 6, created_at: '', updated_at: '' },
];

type WhyChooseUsSectionProps = {
  prefetchedWhyStats?: WhyChooseUsStat[];
  prefetchedWhyReasons?: WhyChooseUsReason[];
  prefetchedWhyContent?: SiteContent | null;
  homepageDataPending?: boolean;
};

export default function WhyChooseUsSection({
  prefetchedWhyStats,
  prefetchedWhyReasons,
  prefetchedWhyContent,
  homepageDataPending,
}: WhyChooseUsSectionProps = {}) {
  const [stats, setStats] = useState<WhyChooseUsStat[]>([]);
  const [reasons, setReasons] = useState<WhyChooseUsReason[]>([]);
  const [header, setHeader] = useState<{
    title: string;
    subtitle: string;
    description: string | null;
  }>(DEFAULT_WHY_HEADER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedWhyStats !== undefined && prefetchedWhyReasons !== undefined) {
      setStats(prefetchedWhyStats.length > 0 ? prefetchedWhyStats : DEFAULT_STATS);
      setReasons(prefetchedWhyReasons.length > 0 ? prefetchedWhyReasons : DEFAULT_REASONS);
      if (prefetchedWhyContent) {
        setHeader({
          title: prefetchedWhyContent.title || DEFAULT_WHY_HEADER.title,
          subtitle: prefetchedWhyContent.subtitle || DEFAULT_WHY_HEADER.subtitle,
          description: prefetchedWhyContent.description || null,
        });
      }
      setLoading(false);
      return;
    }

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
            title: contentRes.title || DEFAULT_WHY_HEADER.title,
            subtitle: contentRes.subtitle || DEFAULT_WHY_HEADER.subtitle,
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
  }, [homepageDataPending, prefetchedWhyStats, prefetchedWhyReasons, prefetchedWhyContent]);

  if (loading) return null;

  const tagline = header.description || DEFAULT_WHY_HEADER.description;

  return (
    <HomeSectionShell
      ariaLabelledBy="why-choose-us-heading"
      badge={header.subtitle}
      title={<HomeSectionSplitTitle line1="Why Phoenix" accent="Events?" />}
      subtitle={tagline}
      variant="white"
      contentClassName="pt-0"
      backgroundOverlay={<HomeSectionBackground variant="grid-glow" />}
    >
      <div className="mx-auto max-w-7xl space-y-5 px-5 sm:px-6 md:space-y-6 lg:px-10">
        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="home-card px-4 py-4 sm:px-5 sm:py-5"
              >
                <p className="font-serif text-2xl font-semibold tabular-nums text-foreground md:text-[1.75rem]">
                  {stat.stat_value}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{stat.stat_label}</p>
                {stat.stat_description ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {stat.stat_description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {reasons.length > 0 ? (
          <div className="border-t border-border pt-6 md:pt-7">
            <div className="border-l-[3px] border-primary/70 pl-4 md:pl-5">
              <h3 className="font-serif text-xl font-medium text-foreground md:text-2xl">
                What Sets Us Apart
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
                The details that make every event exceptional
              </p>
            </div>

            <ul className="mt-5 grid list-none gap-2.5 p-0 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3 md:mt-6">
              {reasons.map((reason, index) => (
                <li
                  key={reason.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background px-3.5 py-3"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold tabular-nums text-primary"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium leading-snug text-foreground md:text-[15px] md:leading-relaxed">
                    {reason.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </HomeSectionShell>
  );
}
