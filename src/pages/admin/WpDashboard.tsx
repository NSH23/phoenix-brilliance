import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircleMore, ChartColumn, Mail, Clapperboard, Cog, Loader2, Info } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getWpDashboardSummary, getRecentWpLeads, getWpUnreadNotificationsCount } from '@/services/wpAgent';
import { supabase } from '@/lib/supabase';

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

  const wpSummary = wpSummaryQuery.data ?? {
    totalLeads: 0,
    newLeads: 0,
    highPriorityLeads: 0,
    callbacksDue: 0,
    avgLeadScore: 0,
  };

  const tiles = [
    { label: 'Total leads', value: wpSummary.totalLeads },
    { label: 'New', value: wpSummary.newLeads },
    { label: 'High priority', value: wpSummary.highPriorityLeads },
    { label: 'Callbacks due', value: wpSummary.callbacksDue },
    { label: 'Avg score', value: wpSummary.avgLeadScore },
  ];

  return (
    <AdminLayout title="WP Agent" subtitle="WhatsApp lead pipeline, media, and alerts.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/60 bg-card/50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {wpSummaryQuery.isPending ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted" /> : t.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Alert className="mb-8 border-primary/25 bg-muted/25">
        <Info className="h-4 w-4" />
        <AlertTitle>Website inquiry → WhatsApp</AlertTitle>
        <AlertDescription>
          <p className="text-sm leading-relaxed">
            New inquiries already create a website lead in the database. To mirror your Railway agent (greeting plus
            event and venue media), deploy the Edge Function <span className="font-mono text-xs">forward-inquiry-whatsapp</span>,
            set secrets <span className="font-mono text-xs">WA_WEBSITE_LEAD_URL</span> (full URL to{' '}
            <span className="font-mono text-xs">/website-lead</span>) and <span className="font-mono text-xs">WEBHOOK_SECRET</span>,
            then add a Database Webhook on <span className="font-mono text-xs">public.inquiries</span> INSERT to that
            function with header <span className="font-mono text-xs">x-phoenix-webhook-secret</span>. You can keep your
            existing web push webhook alongside this second hook.
          </p>
        </AlertDescription>
      </Alert>

      <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3" asChild>
          <Link to="/admin/wp-leads">
            <MessageCircleMore className="h-5 w-5" />
            <span className="text-xs font-medium">Leads</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3" asChild>
          <Link to="/admin/wp-analytics">
            <ChartColumn className="h-5 w-5" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3" asChild>
          <Link to="/admin/wp-media">
            <Clapperboard className="h-5 w-5" />
            <span className="text-xs font-medium">Media</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3" asChild>
          <Link to="/admin/wp-alerts">
            <Mail className="h-5 w-5" />
            <span className="text-xs font-medium">Alerts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3" asChild>
          <Link to="/admin/wp-settings">
            <Cog className="h-5 w-5" />
            <span className="text-xs font-medium">WP settings</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto min-h-[52px] flex-col gap-1 py-3" asChild>
          <Link to="/admin/dashboard">
            <span className="text-xs font-medium">Website dashboard</span>
          </Link>
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-muted/20 py-4">
          <CardTitle className="text-base">Recent leads</CardTitle>
          <Link to="/admin/wp-alerts" className="text-xs text-primary hover:underline whitespace-nowrap">
            {(wpUnreadAlertsQuery.data ?? 0) > 0
              ? `${wpUnreadAlertsQuery.data} unread alerts`
              : 'Open alerts'}
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentWpLeadsQuery.isPending ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !recentWpLeadsQuery.data?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No WP leads yet.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {recentWpLeadsQuery.data.map((lead) => (
                <Link
                  key={lead.id}
                  to={
                    lead.phone ? `/admin/wp-leads?phone=${encodeURIComponent(lead.phone)}` : '/admin/wp-leads'
                  }
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{lead.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.event_type || '—'} • {lead.source_channel || '—'}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
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
