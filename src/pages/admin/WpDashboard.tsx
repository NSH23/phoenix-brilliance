import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircleMore,
  ChartColumn,
  Mail,
  Clapperboard,
  Cog,
  Loader2,
  Users,
  UserPlus,
  Flame,
  Phone,
  Award,
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

const statTiles: {
  key: keyof WpDashboardSummary;
  label: string;
  icon: typeof Users;
  gradient: string;
}[] = [
  { key: 'totalLeads', label: 'Total leads', icon: Users, gradient: 'from-primary to-rose-gold' },
  { key: 'newLeads', label: 'New', icon: UserPlus, gradient: 'from-emerald-500 to-teal-600' },
  { key: 'highPriorityLeads', label: 'High priority', icon: Flame, gradient: 'from-orange-500 to-amber-600' },
  { key: 'callbacksDue', label: 'Callbacks due', icon: Phone, gradient: 'from-blue-500 to-indigo-600' },
  { key: 'avgLeadScore', label: 'Avg score', icon: Award, gradient: 'from-violet-500 to-purple-600' },
];

function defaultSummary() {
  return {
    totalLeads: 0,
    newLeads: 0,
    highPriorityLeads: 0,
    callbacksDue: 0,
    avgLeadScore: 0,
  };
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

  return (
    <AdminLayout title="WP Agent" subtitle="WhatsApp leads, media, and alerts.">
      {/* Stats — same mobile rhythm as main admin dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 max-md:gap-3">
        {statTiles.map((t, index) => {
          const Icon = t.icon;
          const value = wpSummary[t.key];
          return (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.16), duration: 0.22 }}
            >
              <Card className="relative overflow-hidden border border-border/60 sm:border-none shadow-sm bg-card/50 backdrop-blur-sm rounded-2xl sm:rounded-lg max-md:rounded-xl max-md:min-h-[100px]">
                <CardContent className="p-4 sm:p-5 max-md:p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{t.label}</p>
                      <p className="text-2xl sm:text-3xl max-md:text-[1.65rem] font-bold mt-1.5 tabular-nums">
                        {wpSummaryQuery.isPending ? (
                          <span className="inline-block h-8 w-10 rounded bg-muted animate-pulse" />
                        ) : (
                          value
                        )}
                      </p>
                    </div>
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-md shrink-0`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${t.gradient} opacity-45`} />
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 max-md:gap-2.5">
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3 max-md:min-h-[56px]" asChild>
          <Link to="/admin/wp-leads">
            <MessageCircleMore className="h-5 w-5" />
            <span className="text-xs font-medium">Leads</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3 max-md:min-h-[56px]" asChild>
          <Link to="/admin/wp-analytics">
            <ChartColumn className="h-5 w-5" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3 max-md:min-h-[56px]" asChild>
          <Link to="/admin/wp-media">
            <Clapperboard className="h-5 w-5" />
            <span className="text-xs font-medium">Media</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3 max-md:min-h-[56px]" asChild>
          <Link to="/admin/wp-alerts">
            <Mail className="h-5 w-5" />
            <span className="text-xs font-medium">Alerts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3 max-md:min-h-[56px]" asChild>
          <Link to="/admin/wp-settings">
            <Cog className="h-5 w-5" />
            <span className="text-xs font-medium">WP settings</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto min-h-[52px] flex-col gap-1 py-3 max-md:min-h-[56px] col-span-2 sm:col-span-1 lg:col-span-1"
          asChild
        >
          <Link to="/admin/dashboard">
            <span className="text-xs font-medium">Website dashboard</span>
          </Link>
        </Button>
      </div>

      <Card className="border border-border/60 sm:border-muted/60 rounded-2xl sm:rounded-lg max-md:rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 border-b border-border/40 bg-muted/20 py-3 px-4 sm:py-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base font-semibold">Recent leads</CardTitle>
          <Link
            to="/admin/wp-alerts"
            className="text-xs text-primary hover:underline whitespace-nowrap max-md:self-start"
          >
            {(wpUnreadAlertsQuery.data ?? 0) > 0
              ? `${wpUnreadAlertsQuery.data} unread alerts`
              : 'Open alerts'}
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentWpLeadsQuery.isPending ? (
            <div className="flex justify-center py-10 max-md:py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !recentWpLeadsQuery.data?.length ? (
            <p className="py-8 sm:py-10 text-center text-sm text-muted-foreground px-4">No WP leads yet.</p>
          ) : (
            <div className="divide-y divide-border/40 max-md:divide-y-0 max-md:gap-2 max-md:p-2 max-md:flex max-md:flex-col">
              {recentWpLeadsQuery.data.map((lead) => (
                <Link
                  key={lead.id}
                  to={lead.phone ? `/admin/wp-leads?phone=${encodeURIComponent(lead.phone)}` : '/admin/wp-leads'}
                  className="flex items-start gap-3 px-4 py-3 sm:py-3.5 transition-colors hover:bg-muted/40 active:bg-muted/50 max-md:rounded-xl max-md:border max-md:border-border/50 max-md:bg-card/80 max-md:px-3.5 max-md:py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{lead.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lead.event_type || '—'} · {lead.source_channel || '—'}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground whitespace-nowrap text-right max-md:text-xs">
                    {new Date(lead.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
