import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircleMore,
  Mail,
  Cog,
  Loader2,
  Users,
  UserPlus,
  Flame,
  Phone,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getWpDashboardSummary,
  getRecentWpLeads,
  getWpUnreadNotificationsCount,
  refreshWpSlaNotifications,
  type WpDashboardSummary,
} from '@/services/wpAgent';
import { supabase } from '@/lib/supabase';
import { adminSectionTitleClass } from '@/components/admin/adminStyles';
import { cn } from '@/lib/utils';

type WpOverviewCard = {
  key: keyof WpDashboardSummary;
  label: string;
  href: string;
  icon: typeof Users;
  hint?: string;
};

const overviewCards: WpOverviewCard[] = [
  { key: 'totalLeads', label: 'Total leads', href: '/admin/wp-leads', icon: Users },
  { key: 'newLeads', label: 'New', href: '/admin/wp-leads', icon: UserPlus },
  {
    key: 'highPriorityLeads',
    label: 'High priority',
    href: '/admin/wp-leads',
    icon: Flame,
  },
  { key: 'callbacksDue', label: 'Callbacks due', href: '/admin/wp-leads', icon: Phone },
  { key: 'avgLeadScore', label: 'Avg score', href: '/admin/wp-analytics', icon: Award },
];

function defaultSummary(): WpDashboardSummary {
  return {
    totalLeads: 0,
    newLeads: 0,
    highPriorityLeads: 0,
    callbacksDue: 0,
    avgLeadScore: 0,
  };
}

function WpOverviewStatCard({
  card,
  value,
  loading,
  index,
}: {
  card: WpOverviewCard;
  value: number;
  loading: boolean;
  index: number;
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
          className={cn(
            'h-full border border-border/80 bg-card shadow-sm transition-all',
            'rounded-lg sm:rounded-xl hover:border-border hover:shadow-md active:scale-[0.98]'
          )}
        >
          <CardContent className="flex flex-col p-2.5 sm:p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="admin-stat-icon h-7 w-7 shrink-0 sm:h-8 sm:w-8">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">
                {card.label}
              </span>
            </div>
            <p className="text-lg font-extrabold tabular-nums leading-none text-foreground sm:text-xl">
              {loading ? (
                <span className="inline-block h-6 w-8 animate-pulse rounded bg-muted sm:h-7" />
              ) : (
                value
              )}
            </p>
            {card.hint ? (
              <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">{card.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function WpDashboard() {
  const queryClient = useQueryClient();

  const wpSummaryQuery = useQuery({
    queryKey: ['wp-dashboard-summary'],
    queryFn: getWpDashboardSummary,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  const recentWpLeadsQuery = useQuery({
    queryKey: ['wp-recent-leads-dashboard'],
    queryFn: () => getRecentWpLeads(5),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  const wpUnreadAlertsQuery = useQuery({
    queryKey: ['wp-unread-notifications-count'],
    queryFn: getWpUnreadNotificationsCount,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    void refreshWpSlaNotifications()
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['wp-unread-notifications-count'] });
      })
      .catch(() => {
        /* RPC may not be deployed yet */
      });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('wp-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wp_leads' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['wp-recent-leads-dashboard'] });
        void queryClient.invalidateQueries({ queryKey: ['wp-dashboard-summary'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wp_notifications' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['wp-unread-notifications-count'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const wpSummary = wpSummaryQuery.data ?? defaultSummary();
  const unreadAlerts = wpUnreadAlertsQuery.data ?? 0;

  const cardsWithHints = overviewCards.map((card) => {
    if (card.key === 'newLeads' && wpSummary.newLeads > 0) {
      return { ...card, hint: 'Needs follow-up' };
    }
    if (card.key === 'callbacksDue' && wpSummary.callbacksDue > 0) {
      return { ...card, hint: 'Due now' };
    }
    return card;
  });

  return (
    <AdminLayout
      title="WP Agent"
      subtitle="WhatsApp leads, media, and alerts."
      headerActions={
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          asChild
        >
          <Link to="/admin/wp-settings" aria-label="WP settings">
            <Cog className="h-5 w-5" />
          </Link>
        </Button>
      }
    >
      <section className="mb-6 sm:mb-8">
        <p className={cn(adminSectionTitleClass, 'mb-3 px-0.5')}>Overview</p>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-5">
          {cardsWithHints.map((card, index) => (
            <WpOverviewStatCard
              key={card.key}
              card={card}
              value={wpSummary[card.key]}
              loading={wpSummaryQuery.isPending}
              index={index}
            />
          ))}
        </div>
      </section>

      <Card className="admin-panel-card">
        <CardHeader className="admin-muted-header flex flex-row items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <MessageCircleMore className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base font-semibold">Recent leads</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="admin-link-accent h-9 shrink-0" asChild>
            <Link to="/admin/wp-alerts">
              {unreadAlerts > 0 ? `${unreadAlerts} unread alerts` : 'Open alerts'}
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentWpLeadsQuery.isPending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !recentWpLeadsQuery.data?.length ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <MessageCircleMore className="h-8 w-8 opacity-25" aria-hidden />
              <p className="text-sm">No WP leads yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentWpLeadsQuery.data.map((lead) => {
                const initials =
                  (lead.name || '?')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || '?';
                return (
                  <Link
                    key={lead.id}
                    to={
                      lead.phone
                        ? `/admin/wp-leads?phone=${encodeURIComponent(lead.phone)}`
                        : '/admin/wp-leads'
                    }
                    className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/40 active:bg-muted/50 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="admin-avatar-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{lead.name || 'Unknown'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.event_type || '—'} · {lead.source_channel || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
