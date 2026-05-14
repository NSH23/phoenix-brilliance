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

const PAGE_SIZE = 20;

const statusList: Array<{ value: WpLeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

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
    <AdminLayout
      title="WP Agent Leads"
      subtitle="WhatsApp lead pipeline with search, filters and status updates"
    >
      <div className="xl:grid xl:grid-cols-[1fr_280px] xl:items-start gap-6">
        <div className="space-y-5 sm:space-y-6 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: "Total leads", value: summary.totalLeads },
              { title: "New today", value: summary.newToday },
              { title: "Website leads", value: summary.websiteLeads },
              { title: "WhatsApp leads", value: summary.whatsappLeads },
            ].map((c) => (
              <Card key={c.title} className="rounded-2xl sm:rounded-lg border border-border/60">
                <CardHeader className="pb-2 p-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 p-4">
                  {summaryLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:hidden">
            <Card className="rounded-2xl border border-border/60">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Pending follow-ups
                  {!pendingLoading && pendingCount > 0 ? (
                    <Badge variant="destructive" className="ml-1">
                      {pendingCount}
                    </Badge>
                  ) : null}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-8 gap-1 text-xs"
                  disabled={processFollowupsBusy}
                  onClick={() => void onProcessFollowups()}
                >
                  {processFollowupsBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5" />
                  )}
                  Run due
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {pendingLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : pendingToday.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None scheduled for today.</p>
                ) : (
                  <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                    {pendingToday.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="w-full text-left rounded-lg border border-border/50 px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const row = rows.find((r) => r.phone != null && wpPhonesMatch(r.phone, p.lead_phone));
                            if (row) openLeadDetail(row);
                            else {
                              void (async () => {
                                const lead = await getWpLeadByPhone(p.lead_phone);
                                if (lead) openLeadDetail(lead);
                                else toast.error("Lead not found for this follow-up");
                              })();
                            }
                          }}
                        >
                          <p className="text-sm font-medium truncate">{p.lead_name || p.lead_phone}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.scheduled_at).toLocaleTimeString([], {
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
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone or event"
                className="pl-10 h-11 sm:h-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[220px] h-11 sm:h-10">
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
              <SelectTrigger className="w-full sm:w-[220px] h-11 sm:h-10">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="website">Website inquiry form</SelectItem>
                <SelectItem value="whatsapp">WhatsApp direct</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-11 sm:h-10 sm:px-5" onClick={() => void loadRows(0)} disabled={loading}>
              Apply
            </Button>
          </div>

          <Card className="rounded-2xl sm:rounded-lg border border-border/60 sm:border-border">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-14">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">No leads found.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {rows.map((lead) => (
                    <div
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      className="p-4 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => openLeadDetail(lead)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openLeadDetail(lead);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <p className="font-semibold truncate max-w-full">{lead.name || "Unknown"}</p>
                          <Badge variant="outline">{lead.event_type || "General"}</Badge>
                          {lead.venue ? <Badge variant="outline">{lead.venue}</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground break-words">
                          {lead.phone || "No phone"} {lead.package_type ? `• ${lead.package_type}` : ""}{" "}
                          {lead.source_channel ? `• ${lead.source_channel}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {lead.last_message || "No message"}
                        </p>
                      </div>
                      <div
                        className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full lg:w-auto"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Badge className="w-fit">{lead.status}</Badge>
                        <Select value={lead.status} onValueChange={(v) => void onStatusChange(lead.id, v as WpLeadStatus)}>
                          <SelectTrigger className="w-full sm:w-[170px] h-11 sm:h-10">
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-11 sm:h-9 w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSendLead(lead);
                            setSendMessage("");
                          }}
                        >
                          <MessageSquarePlus className="w-4 h-4 mr-1" />
                          Send message
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-11 sm:h-9 w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteLead(lead);
                          }}
                          disabled={!lead.phone}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
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

        <aside className="hidden xl:block space-y-4 sticky top-24">
          <Card className="rounded-2xl border border-border/60">
            <CardHeader className="pb-2 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Pending follow-ups
                  {!pendingLoading && pendingCount > 0 ? (
                    <Badge variant="destructive" className="ml-auto">
                      {pendingCount}
                    </Badge>
                  ) : null}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-8 gap-1 text-xs"
                  disabled={processFollowupsBusy}
                  onClick={() => void onProcessFollowups()}
                  title="Calls the Railway agent to send follow-ups whose scheduled time has passed"
                >
                  {processFollowupsBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5" />
                  )}
                  Run due
                </Button>
              </div>
              <p className="text-xs text-muted-foreground font-normal">Scheduled for today</p>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : pendingToday.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">None today.</p>
              ) : (
                <ul className="space-y-2 max-h-[min(60vh,420px)] overflow-y-auto pr-1">
                  {pendingToday.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-left rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          const row = rows.find((r) => r.phone != null && wpPhonesMatch(r.phone, p.lead_phone));
                          if (row) openLeadDetail(row);
                          else {
                            void (async () => {
                              const lead = await getWpLeadByPhone(p.lead_phone);
                              if (lead) openLeadDetail(lead);
                              else toast.error("Lead not found for this follow-up");
                            })();
                          }
                        }}
                      >
                        <p className="text-sm font-medium truncate">{p.lead_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{p.lead_phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(p.scheduled_at).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
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
