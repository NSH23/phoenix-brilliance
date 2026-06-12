import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FolderOpen,
  Handshake,
  Mail,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Users,
  Wrench,
  MessageSquareQuote,
  Activity,
  Film,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  getDashboardData,
  getRecentActivity,
  type DashboardStats,
  type RecentInquiry,
  type RecentActivity,
  type SiteOverview,
} from '@/services/dashboard';
import { adminSectionTitleClass } from '@/components/admin/adminStyles';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type OverviewTone = 'blue' | 'violet' | 'cyan' | 'amber' | 'indigo' | 'teal' | 'rose' | 'slate';

type OverviewCardData = {
  label: string;
  value: number;
  hint?: string;
  href: string;
  icon: typeof Calendar;
  highlight?: boolean;
  tone: OverviewTone;
};

function OverviewCard({
  card,
  index,
  compact = false,
}: {
  card: OverviewCardData;
  index: number;
  compact?: boolean;
}) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.25 }}
    >
      <Link to={card.href} className="group block h-full">
        <Card
          data-tone={card.tone}
          className={cn(
            'admin-overview-card h-full border border-border/80 bg-card shadow-sm transition-all',
            compact ? 'rounded-lg' : 'rounded-xl',
            'hover:border-border hover:shadow-md active:scale-[0.98]',
            card.highlight && 'ring-1 ring-[hsl(var(--admin-accent)/0.35)]'
          )}
        >
          <CardContent className={cn('flex flex-col', compact ? 'p-2' : 'p-3')}>
            <div className="mb-1 flex items-center gap-1">
              <span
                className={cn(
                  'admin-stat-icon shrink-0',
                  compact ? 'h-6 w-6' : 'h-7 w-7'
                )}
              >
                <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-medium leading-tight text-muted-foreground',
                  compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'
                )}
              >
                {compact && card.label === 'Media' ? 'Media' : card.label}
              </span>
            </div>
            <p
              className={cn(
                'font-extrabold tabular-nums leading-none text-foreground',
                compact ? 'text-base' : 'text-lg sm:text-xl'
              )}
            >
              {card.value}
            </p>
            {card.hint ? (
              <p
                className={cn(
                  'mt-0.5 flex items-center gap-0.5 truncate font-medium text-emerald-600 dark:text-emerald-400',
                  compact ? 'text-[9px]' : 'text-[10px]'
                )}
              >
                <TrendingUp className="h-2.5 w-2.5 shrink-0" aria-hidden />
                <span className="truncate">{card.hint}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function buildOverviewCards(
  st: DashboardStats,
  over: SiteOverview
): OverviewCardData[] {
  const eventHint =
    st.events.thisMonth > 0 ? `+${st.events.thisMonth} this month` : undefined;
  const albumHint =
    st.albums.thisMonth > 0 ? `+${st.albums.thisMonth} this month` : undefined;

  return [
    {
      label: 'Total Events',
      value: st.events.total,
      hint: eventHint,
      href: '/admin/events',
      icon: Calendar,
      tone: 'blue',
    },
    {
      label: 'Albums',
      value: st.albums.total,
      hint: albumHint,
      href: '/admin/albums',
      icon: FolderOpen,
      tone: 'violet',
    },
    {
      label: 'Media',
      value: st.galleryImages.total,
      hint: 'Hero & reels',
      href: '/admin/media',
      icon: Film,
      tone: 'cyan',
    },
    {
      label: 'Inquiries',
      value: st.inquiries.total,
      hint: st.inquiries.new > 0 ? `${st.inquiries.new} new` : undefined,
      href: '/admin/notifications',
      icon: Mail,
      highlight: st.inquiries.new > 0,
      tone: 'amber',
    },
    {
      label: 'Partners',
      value: over.partners,
      href: '/admin/collaborations',
      icon: Handshake,
      tone: 'indigo',
    },
    {
      label: 'Services',
      value: over.services,
      href: '/admin/services',
      icon: Wrench,
      tone: 'teal',
    },
    {
      label: 'Testimonials',
      value: over.testimonials,
      href: '/admin/testimonials',
      icon: MessageSquareQuote,
      tone: 'rose',
    },
    {
      label: 'Team',
      value: st.team.total,
      hint: st.team.active > 0 ? `${st.team.active} active` : undefined,
      href: '/admin/team',
      icon: Users,
      tone: 'slate',
    },
  ];
}

function ActivityTimeline({ items, className }: { items: RecentActivity[]; className?: string }) {
  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground', className)}>
        <Activity className="h-8 w-8 opacity-25" aria-hidden />
        <p className="text-sm">No recent activity yet.</p>
        <p className="text-xs opacity-80">Updates to events, albums, and content will appear here.</p>
      </div>
    );
  }

  return (
    <ul className={cn('space-y-0', className)}>
      {items.map((activity, index) => (
        <li key={activity.id} className="relative flex gap-3 pb-6 last:pb-0">
          {index < items.length - 1 && (
            <span
              className="admin-timeline-line absolute left-[11px] top-6 bottom-0 w-px"
              aria-hidden
            />
          )}
          <span
            className="admin-timeline-dot relative z-[1] mt-1.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2"
            aria-hidden
          >
            <span className="admin-timeline-dot-inner h-2 w-2 rounded-full" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium leading-snug text-foreground">{activity.action}</p>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{activity.target}</p>
            <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/90">{activity.time}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InquiryRow({ inquiry }: { inquiry: RecentInquiry }) {
  return (
    <Link
      to={`/admin/notifications?tab=inquiries&open=${inquiry.id}`}
      className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/40 active:bg-muted/50 sm:p-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="admin-avatar-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm">
          {inquiry.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{inquiry.name}</p>
          <p className="truncate text-xs text-muted-foreground">{inquiry.event}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            inquiry.status === 'new'
              ? 'admin-status-new'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {inquiry.status}
        </span>
        <p className="mt-1 text-[10px] text-muted-foreground">{inquiry.date}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: getDashboardData,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  const allActivityQuery = useQuery({
    queryKey: ['dashboard-all-activity'],
    queryFn: () => getRecentActivity(25),
    enabled: activitySheetOpen,
    staleTime: 60 * 1000,
  });

  const stats = dashboardQuery.data?.stats ?? null;
  const recentInquiries = dashboardQuery.data?.recentInquiries ?? [];
  const recentActivity = dashboardQuery.data?.recentActivity ?? [];
  const siteOverview = dashboardQuery.data?.siteOverview ?? null;

  useEffect(() => {
    if (!dashboardQuery.isError) return;
    const e = dashboardQuery.error;
    logger.error('Dashboard load error', e, { component: 'AdminDashboard', action: 'load' });
    toast.error('Failed to load dashboard', {
      description: e instanceof Error ? e.message : 'Please try again.',
    });
  }, [dashboardQuery.isError, dashboardQuery.error]);

  if (dashboardQuery.isPending) {
    return (
      <AdminLayout title="Dashboard" subtitle="Website content at a glance.">
        <div className="mb-6 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-4 xl:grid-cols-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-lg border border-border/80 bg-card shadow-sm">
              <CardContent className="p-2">
                <div className="mb-1 h-2.5 w-10 animate-pulse rounded bg-muted" />
                <div className="h-5 w-6 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-2xl border border-border/80 bg-card shadow-sm">
              <CardHeader className="border-b border-border/40 py-4">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  const st: DashboardStats = stats ?? {
    events: { total: 0, thisMonth: 0 },
    albums: { total: 0, thisMonth: 0 },
    galleryImages: { total: 0, thisMonth: 0 },
    inquiries: { total: 0, new: 0 },
    team: { total: 0, active: 0, thisMonth: 0 },
  };
  const over: SiteOverview = siteOverview ?? {
    eventTypes: 0,
    albums: 0,
    partners: 0,
    testimonials: 0,
    services: 0,
    employees: 0,
  };
  const overviewCards = buildOverviewCards(st, over);

  return (
    <AdminLayout title="Dashboard" subtitle="Website content at a glance.">
      {/* Overview */}
      <section className="mb-6 sm:mb-8">
        <p className={cn(adminSectionTitleClass, 'mb-3 px-0.5')}>Overview</p>
        <div className="space-y-1.5 sm:space-y-0">
          {/* Mobile: 3×2 grid, then remaining cards in one row */}
          <div className="grid grid-cols-3 grid-rows-2 gap-1.5 sm:hidden">
            {overviewCards.slice(0, 6).map((card, index) => (
              <OverviewCard key={card.label} card={card} index={index} compact />
            ))}
          </div>
          {overviewCards.length > 6 ? (
            <div className="grid grid-cols-2 gap-1.5 sm:hidden">
              {overviewCards.slice(6).map((card, index) => (
                <OverviewCard key={card.label} card={card} index={index + 6} compact />
              ))}
            </div>
          ) : null}

          {/* Tablet+ */}
          <div className="hidden grid-cols-4 gap-2 sm:grid xl:grid-cols-8">
            {overviewCards.map((card, index) => (
              <OverviewCard key={card.label} card={card} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Inquiries + Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.25 }}
        >
          <Card className="admin-panel-card flex h-full flex-col">
            <CardHeader className="admin-muted-header flex flex-row items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[hsl(var(--admin-accent))]" aria-hidden />
                <CardTitle className="text-base font-semibold">Recent Inquiries</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="admin-link-accent h-9 shrink-0" asChild>
                <Link to="/admin/notifications">
                  View all
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="divide-y divide-border/50">
                {recentInquiries.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
                    <Mail className="h-8 w-8 opacity-25" aria-hidden />
                    <p className="text-sm">No inquiries yet.</p>
                  </div>
                ) : (
                  recentInquiries.map((inquiry) => (
                    <InquiryRow key={inquiry.id} inquiry={inquiry} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.25 }}
        >
          <Card className="admin-panel-card flex h-full flex-col">
            <CardHeader className="admin-muted-header flex flex-row items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" aria-hidden />
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </div>
              <Sheet open={activitySheetOpen} onOpenChange={setActivitySheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="admin-link-accent h-9 shrink-0">
                    View all activity
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Recent activity</SheetTitle>
                    <SheetDescription>
                      Latest changes across events, albums, gallery, and testimonials.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-1 pb-6 pt-2">
                    {allActivityQuery.isPending ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <ActivityTimeline items={allActivityQuery.data ?? []} />
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </CardHeader>
            <CardContent className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
              <ActivityTimeline items={recentActivity} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
