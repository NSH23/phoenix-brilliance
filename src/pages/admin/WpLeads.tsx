import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarClock, Loader2, MessageSquarePlus, PlayCircle, Search, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import WpLeadDetailSheet from "@/components/admin/WpLeadDetailSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import {
  deleteWpLeadByPhone,
  getWpLeadByPhone,
  getWpLeadSummaryCards,
  getWpLeadsPage,
  getTodaysPendingFollowupsWithNames,
  scheduleWpFollowup,
  triggerWpProcessFollowups,
  updateWpLeadStatus,
  wpLeadPhoneKeyVariants,
  wpPhonesMatch,
  type WpFollowup,
  type WpLead,
  type WpLeadStatus,
} from "@/services/wpAgent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const statusList: Array<{ value: WpLeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function statusBadgeClass(status: WpLeadStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
    case "contacted":
      return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20";
    case "qualified":
      return "bg-violet-500/10 text-violet-800 dark:text-violet-300 border-violet-500/20";
    case "converted":
      return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20";
    case "lost":
      return "bg-muted text-muted-foreground border-border/60";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
}

function leadInitials(name: string | null | undefined): string {
  return (
    (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function WpLeadRow({
  lead,
  onOpenDetail,
  onStatusChange,
  onSend,
  onDelete,
}: {
  lead: WpLead;
  onOpenDetail: (lead: WpLead) => void;
  onStatusChange: (id: string, status: WpLeadStatus) => void;
  onSend: (lead: WpLead) => void;
  onDelete: (lead: WpLead) => void;
}) {
  const contactLine = [lead.phone || 'No phone', lead.source_channel].filter(Boolean).join(' • ');
  const initials = leadInitials(lead.name);
  const hasMessage = Boolean(lead.last_message?.trim());

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm lg:flex lg:items-center lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-4 lg:shadow-none lg:hover:bg-muted/30">
      {/* Mobile card */}
      <div className="lg:hidden">
        <button
          type="button"
          className="w-full p-4 text-left active:bg-muted/20"
          onClick={() => onOpenDetail(lead)}
        >
          <div className="flex items-start gap-3">
            <div className="admin-avatar-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-base font-semibold leading-tight text-foreground">
                  {lead.name || 'Unknown'}
                </p>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 capitalize text-[10px]', statusBadgeClass(lead.status))}
                >
                  {lead.status}
                </Badge>
              </div>
              {(lead.event_type || lead.venue) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lead.event_type ? (
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {lead.event_type}
                    </Badge>
                  ) : null}
                  {lead.venue ? (
                    <Badge variant="outline" className="max-w-full truncate text-[10px] font-normal">
                      {lead.venue}
                    </Badge>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2 pl-14">
            <p className="text-sm text-muted-foreground break-all">{contactLine}</p>
            <div
              className={cn(
                'rounded-lg px-3 py-2 text-xs leading-relaxed',
                hasMessage ? 'bg-muted/35 text-foreground' : 'bg-muted/20 italic text-muted-foreground'
              )}
            >
              {hasMessage ? lead.last_message : 'No message'}
            </div>
          </div>
        </button>

        <div
          className="space-y-2.5 border-t border-border/50 bg-muted/15 px-3 py-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <Select value={lead.status} onValueChange={(v) => void onStatusChange(lead.id, v as WpLeadStatus)}>
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusList.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="sm" className="h-10" onClick={() => onSend(lead)}>
              <MessageSquarePlus className="mr-1.5 h-4 w-4" />
              Send
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(lead)}
              disabled={!lead.phone}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden lg:contents">
        <button
          type="button"
          className="flex-1 p-0 text-left lg:hover:bg-transparent"
          onClick={() => onOpenDetail(lead)}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{lead.name || 'Unknown'}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {lead.event_type ? (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {lead.event_type}
                </Badge>
              ) : null}
              {lead.venue ? (
                <Badge variant="outline" className="max-w-full truncate text-[11px] font-normal">
                  {lead.venue}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground break-all">
              {contactLine}
              {lead.package_type ? ` · ${lead.package_type}` : ''}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {lead.last_message || 'No message'}
            </p>
          </div>
        </button>

        <div
          className="flex shrink-0 flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Select value={lead.status} onValueChange={(v) => void onStatusChange(lead.id, v as WpLeadStatus)}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusList.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="secondary" size="sm" className="h-9" onClick={() => onSend(lead)}>
            <MessageSquarePlus className="mr-1.5 h-4 w-4" />
            Send message
          </Button>
          <Button type="button" variant="destructive" size="sm" className="h-9" onClick={() => onDelete(lead)} disabled={!lead.phone}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

function PendingFollowupsPanel({
  pendingLoading,
  pendingToday,
  pendingCount,
  processFollowupsBusy,
  onProcessFollowups,
  rows,
  onOpenLeadDetail,
  compact = false,
}: {
  pendingLoading: boolean;
  pendingToday: Array<WpFollowup & { lead_name: string | null }>;
  pendingCount: number;
  processFollowupsBusy: boolean;
  onProcessFollowups: () => void;
  rows: WpLead[];
  onOpenLeadDetail: (lead: WpLead) => void;
  compact?: boolean;
}) {
  const openFollowup = (p: WpFollowup & { lead_name: string | null }) => {
    const row = rows.find((r) => r.phone != null && wpPhonesMatch(r.phone, p.lead_phone));
    if (row) onOpenLeadDetail(row);
    else {
      void (async () => {
        const lead = await getWpLeadByPhone(p.lead_phone);
        if (lead) onOpenLeadDetail(lead);
        else toast.error("Lead not found for this follow-up");
      })();
    }
  };

  return (
    <Card className="rounded-2xl border border-border/60">
      <CardHeader className={cn("gap-2", compact ? "flex-row items-center justify-between px-4 py-3" : "space-y-2 pb-2")}>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 shrink-0" />
            <span className="truncate">Pending follow-ups</span>
            {!pendingLoading && pendingCount > 0 ? (
              <Badge variant="destructive" className="ml-0.5">
                {pendingCount}
              </Badge>
            ) : null}
          </CardTitle>
          <p className="mt-0.5 text-xs font-normal text-muted-foreground">Scheduled for today</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1 text-xs"
          disabled={processFollowupsBusy}
          onClick={onProcessFollowups}
        >
          {processFollowupsBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlayCircle className="h-3.5 w-3.5" />
          )}
          Run due
        </Button>
      </CardHeader>
      <CardContent className={cn("pt-0", compact ? "px-4 pb-4" : undefined)}>
        {pendingLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pendingToday.length === 0 ? (
          <p className="py-1 text-sm text-muted-foreground">None today.</p>
        ) : (
          <ul className={cn("space-y-2 overflow-y-auto pr-1", compact ? "max-h-[200px]" : "max-h-[min(60vh,420px)]")}>
            {pendingToday.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  onClick={() => openFollowup(p)}
                >
                  <p className="truncate text-sm font-medium">{p.lead_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{p.lead_phone}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.scheduled_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function WpLeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<WpLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState<"all" | "website" | "whatsapp">("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalLeads: 0,
    newToday: 0,
    websiteLeads: 0,
    whatsappLeads: 0,
  });

  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingToday, setPendingToday] = useState<Array<WpFollowup & { lead_name: string | null }>>([]);

  const [detailLead, setDetailLead] = useState<WpLead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [sendLead, setSendLead] = useState<WpLead | null>(null);
  const [sendMessage, setSendMessage] = useState("");
  const [sendBusy, setSendBusy] = useState(false);

  const [deleteLead, setDeleteLead] = useState<WpLead | null>(null);
  const [processFollowupsBusy, setProcessFollowupsBusy] = useState(false);

  const loadSummaries = useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getWpLeadSummaryCards());
    } catch (err) {
      toast.error("Failed to load lead summaries", { description: (err as Error).message });
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      setPendingToday(await getTodaysPendingFollowupsWithNames());
    } catch (err) {
      toast.error("Failed to load pending follow-ups", { description: (err as Error).message });
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadRows = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      try {
        const res = await getWpLeadsPage(nextPage, PAGE_SIZE, search, status, source);
        setRows(res.rows);
        setTotal(res.total);
        setPage(nextPage);
      } catch (err) {
        toast.error("Failed to load WP leads", { description: (err as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [page, search, status, source]
  );

  useEffect(() => {
    void loadRows(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source]);

  useEffect(() => {
    void loadSummaries();
    void loadPending();
  }, [loadSummaries, loadPending]);

  const openLeadDetail = useCallback((lead: WpLead) => {
    setDetailLead(lead);
    setDetailOpen(true);
  }, []);

  const phoneFromUrl = searchParams.get("phone");
  useEffect(() => {
    if (!phoneFromUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const lead = await getWpLeadByPhone(phoneFromUrl);
        if (cancelled) return;
        if (lead) {
          setDetailLead(lead);
          setDetailOpen(true);
        } else {
          toast.error("Lead not found", { description: phoneFromUrl });
        }
      } catch (e) {
        if (!cancelled) toast.error("Failed to open lead", { description: (e as Error).message });
      } finally {
        if (!cancelled) {
          const next = new URLSearchParams(searchParams);
          next.delete("phone");
          setSearchParams(next, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneFromUrl]);

  const listParamsRef = useRef({ page, search, status, source });
  listParamsRef.current = { page, search, status, source };

  useEffect(() => {
    const channel = supabase
      .channel("wp-leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "wp_leads" }, () => {
        const { page: p, search: se, status: st, source: so } = listParamsRef.current;
        void getWpLeadsPage(p, PAGE_SIZE, se, st, so)
          .then((res) => {
            setRows(res.rows);
            setTotal(res.total);
          })
          .catch((err) => toast.error("Failed to refresh leads", { description: (err as Error).message }));
        void loadSummaries();
        void loadPending();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSummaries, loadPending]);

  useEffect(() => {
    const channel = supabase
      .channel("wp-followups-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "wp_followups" }, () => {
        void loadPending();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadPending]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onStatusChange = async (id: string, next: WpLeadStatus) => {
    try {
      const updated = await updateWpLeadStatus(id, next);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setDetailLead((prev) => (prev?.id === id ? updated : prev));
      toast.success("Lead status updated");
    } catch (err) {
      toast.error("Failed to update lead", { description: (err as Error).message });
    }
  };

  const onConfirmDelete = async () => {
    const phone = deleteLead?.phone;
    if (!phone) {
      toast.error("Cannot delete lead without a phone number");
      setDeleteLead(null);
      return;
    }
    try {
      await deleteWpLeadByPhone(phone);
      const keys = new Set(wpLeadPhoneKeyVariants(phone));
      setRows((prev) => prev.filter((r) => r.phone == null || !keys.has(r.phone)));
      if (detailLead?.phone && keys.has(detailLead.phone)) {
        setDetailOpen(false);
        setDetailLead(null);
      }
      toast.success("Lead deleted");
      void loadSummaries();
      void loadPending();
    } catch (err) {
      toast.error("Failed to delete lead", { description: (err as Error).message });
    } finally {
      setDeleteLead(null);
    }
  };

  const onSendMessageSubmit = async () => {
    const phone = sendLead?.phone;
    const msg = sendMessage.trim();
    if (!phone) {
      toast.error("No phone on this lead");
      return;
    }
    if (!msg) {
      toast.error("Enter a message");
      return;
    }
    setSendBusy(true);
    try {
      await scheduleWpFollowup({ phone, message: msg, send_now: true });
      toast.success("Message sent");
      setSendLead(null);
      setSendMessage("");
    } catch (err) {
      toast.error("Send failed", { description: (err as Error).message });
    } finally {
      setSendBusy(false);
    }
  };

  const onProcessFollowups = async () => {
    setProcessFollowupsBusy(true);
    try {
      await triggerWpProcessFollowups();
      toast.success("Agent ran the due follow-up job");
      void loadPending();
    } catch (err) {
      toast.error("Could not reach WhatsApp agent", { description: (err as Error).message });
    } finally {
      setProcessFollowupsBusy(false);
    }
  };

  const pendingCount = pendingToday.length;

  return (
    <AdminLayout title="WP Leads" subtitle="Search, filter, and update WhatsApp leads.">
      <div className="xl:grid xl:grid-cols-[1fr_280px] xl:items-start gap-5 sm:gap-6">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
            {[
              { title: "Total leads", value: summary.totalLeads },
              { title: "New today", value: summary.newToday },
              { title: "Website leads", value: summary.websiteLeads },
              { title: "WhatsApp leads", value: summary.whatsappLeads },
            ].map((c) => (
              <Card key={c.title} className="rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-lg">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">{c.title}</p>
                  {summaryLoading ? (
                    <Loader2 className="mt-2 h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{c.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:hidden">
            <PendingFollowupsPanel
              compact
              pendingLoading={pendingLoading}
              pendingToday={pendingToday}
              pendingCount={pendingCount}
              processFollowupsBusy={processFollowupsBusy}
              onProcessFollowups={() => void onProcessFollowups()}
              rows={rows}
              onOpenLeadDetail={openLeadDetail}
            />
          </div>

          <Card className="rounded-2xl border border-border/60">
            <CardContent className="space-y-3 p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone or event"
                  className="h-11 pl-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {statusList.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={source} onValueChange={(v) => setSource(v as "all" | "website" | "whatsapp")}>
                  <SelectTrigger className="h-11 w-full sm:w-[200px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="website">Website inquiry form</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp direct</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="col-span-2 h-11 w-full sm:col-span-1 sm:w-auto" onClick={() => void loadRows(0)} disabled={loading}>
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-border/60 sm:rounded-lg">
            <CardContent className="p-0 max-md:space-y-3 max-md:p-3">
              {loading ? (
                <div className="flex justify-center py-14 max-md:py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : rows.length === 0 ? (
                <div className="px-4 py-14 text-center text-sm text-muted-foreground max-md:py-12">No leads found.</div>
              ) : (
                <div className="max-md:flex max-md:flex-col max-md:gap-2 lg:divide-y lg:divide-border/50">
                  {rows.map((lead) => (
                    <WpLeadRow
                      key={lead.id}
                      lead={lead}
                      onOpenDetail={openLeadDetail}
                      onStatusChange={onStatusChange}
                      onSend={(l) => {
                        setSendLead(l);
                        setSendMessage("");
                      }}
                      onDelete={setDeleteLead}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages} ({total} total)
            </p>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <Button
                className="h-11 sm:h-10"
                variant="outline"
                onClick={() => void loadRows(page - 1)}
                disabled={loading || page <= 0}
              >
                Previous
              </Button>
              <Button
                className="h-11 sm:h-10"
                variant="outline"
                onClick={() => void loadRows(page + 1)}
                disabled={loading || page + 1 >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <aside className="hidden xl:block sticky top-24 space-y-4">
          <PendingFollowupsPanel
            pendingLoading={pendingLoading}
            pendingToday={pendingToday}
            pendingCount={pendingCount}
            processFollowupsBusy={processFollowupsBusy}
            onProcessFollowups={() => void onProcessFollowups()}
            rows={rows}
            onOpenLeadDetail={openLeadDetail}
          />
        </aside>
      </div>

      <WpLeadDetailSheet lead={detailLead} open={detailOpen} onOpenChange={setDetailOpen} />

      <Dialog
        open={!!sendLead}
        onOpenChange={(o) => {
          if (!o) {
            setSendLead(null);
            setSendMessage("");
          }
        }}
      >
        <DialogContent className="max-md:w-[95vw]">
          <DialogHeader>
            <DialogTitle>Send WhatsApp message</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <p className="text-sm text-muted-foreground break-all">{sendLead?.phone}</p>
            <Label htmlFor="wp-send-msg">Message</Label>
            <Textarea
              id="wp-send-msg"
              rows={5}
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              placeholder="Type the message to send now…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSendLead(null)} disabled={sendBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSendMessageSubmit()} disabled={sendBusy}>
              {sendBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLead} onOpenChange={(o) => !o && setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the lead and all WhatsApp thread data we store for{" "}
              <span className="font-mono text-foreground">{deleteLead?.phone}</span> (including{" "}
              <span className="font-mono text-foreground">91…</span> variants). The next message from that number is
              treated as a fresh contact in the agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onConfirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
