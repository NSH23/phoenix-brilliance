import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  KeyRound,
  Loader2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  buildSendOtpWhatsAppHref,
  getPendingAccessRequests,
  isOtpStillValid,
  type SiteAccessRequest,
} from '@/services/access';
import { formatRelativeTime } from '@/lib/formatDate';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const QUERY_KEY = ['site-access-otp-requests'] as const;

function openWhatsAppSendOtp(request: SiteAccessRequest) {
  const href = buildSendOtpWhatsAppHref(request);
  if (!href) {
    toast.error('No valid phone number for this request');
    return;
  }
  // Prefer navigation so mobile PWA / in-app browsers open WhatsApp reliably.
  window.location.href = href;
}

function AccessRequestRow({
  request,
  expanded,
  onToggle,
}: {
  request: SiteAccessRequest;
  expanded: boolean;
  onToggle: () => void;
}) {
  const otpValid = isOtpStillValid(request.otp_expires_at);
  const firstName = (request.visitor_name || 'Guest').trim().split(/\s+/)[0];

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40 active:bg-muted/50 sm:p-4"
      >
        <div className="admin-avatar-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm">
          {(request.visitor_name || '?')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {request.visitor_name || 'Unknown'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            OTP {request.otp_code}
            {request.event_type ? ` · ${request.event_type}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              request.status === 'pending' && otpValid
                ? 'admin-status-new'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {request.status === 'pending' && otpValid ? 'Send OTP' : request.status}
          </span>
          <p className="text-[10px] text-muted-foreground">{formatRelativeTime(request.created_at)}</p>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border/40 bg-muted/20 px-4 py-3 sm:px-5">
          <div className="grid gap-2 text-sm">
            {request.visitor_phone ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{request.visitor_phone}</span>
              </p>
            ) : null}
            {request.visitor_email ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-foreground">{request.visitor_email}</span>
              </p>
            ) : null}
            {request.event_type ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{request.event_type}</span>
              </p>
            ) : null}
            {request.venue ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{request.venue}</span>
              </p>
            ) : null}
            {request.message ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{request.message}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">OTP</span>
            <span className="font-mono text-lg font-bold tracking-widest text-foreground">
              {request.otp_code}
            </span>
            {!otpValid ? (
              <span className="text-[10px] font-medium text-amber-600">Expired</span>
            ) : null}
          </div>

          <Button
            type="button"
            className="h-11 w-full gap-2 text-sm font-semibold"
            disabled={!otpValid || !request.visitor_phone}
            onClick={() => openWhatsAppSendOtp(request)}
          >
            <MessageCircle className="h-4 w-4" />
            Send OTP to {firstName} on WhatsApp
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AccessOtpPanel() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('otp') || searchParams.get('access') || '';
  const [expandedId, setExpandedId] = useState<string | null>(focusId || null);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getPendingAccessRequests(25),
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });

  const requests = useMemo(() => {
    const list = query.data ?? [];
    // Prefer pending with valid OTP first
    return [...list].sort((a, b) => {
      const aPending = a.status === 'pending' && isOtpStillValid(a.otp_expires_at) ? 0 : 1;
      const bPending = b.status === 'pending' && isOtpStillValid(b.otp_expires_at) ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
  }, [query.data]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending' && isOtpStillValid(r.otp_expires_at)).length,
    [requests],
  );

  useEffect(() => {
    if (!focusId) return;
    setExpandedId(focusId);
    const el = document.getElementById(`access-otp-${focusId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, requests.length]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-access-otp')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_access_requests' },
        () => {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clearFocusParam = useCallback(() => {
    if (!searchParams.has('otp') && !searchParams.has('access')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('otp');
    next.delete('access');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (focusId === id) clearFocusParam();
  };

  return (
    <Card className="admin-panel-card overflow-hidden border-[hsl(var(--admin-accent)/0.25)] shadow-sm">
      <CardHeader className="admin-muted-header flex flex-row items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <KeyRound className="h-4 w-4 shrink-0 text-[hsl(var(--admin-accent))]" aria-hidden />
          <CardTitle className="truncate text-base font-semibold">Access OTP</CardTitle>
          {pendingCount > 0 ? (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {pendingCount}
            </span>
          ) : null}
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">Send code via WhatsApp</p>
      </CardHeader>
      <CardContent className="p-0">
        {query.isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
            <KeyRound className="h-8 w-8 opacity-25" aria-hidden />
            <p className="text-sm">No pending access OTPs</p>
            <p className="text-xs opacity-80">New form submissions will appear here with name + code.</p>
          </div>
        ) : (
          <div className="max-h-[min(28rem,55vh)] overflow-y-auto">
            {requests.map((request) => (
              <div key={request.id} id={`access-otp-${request.id}`}>
                <AccessRequestRow
                  request={request}
                  expanded={expandedId === request.id}
                  onToggle={() => toggle(request.id)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
