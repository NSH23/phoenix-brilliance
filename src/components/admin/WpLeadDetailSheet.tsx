import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  getWpConversationsForPhone,
  getWpFollowupsForPhone,
  scheduleWpFollowup,
  type WpConversation,
  type WpFollowup,
  type WpLead,
} from "@/services/wpAgent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type WpLeadDetailSheetProps = {
  lead: WpLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function metaString(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = metadata?.[key];
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String).filter(Boolean).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function SummaryCard({ label, value }: { label: string; value: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

export default function WpLeadDetailSheet({ lead, open, onOpenChange }: WpLeadDetailSheetProps) {
  const [conversations, setConversations] = useState<WpConversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [followups, setFollowups] = useState<WpFollowup[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followMessage, setFollowMessage] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const phone = lead?.phone ?? "";

  useEffect(() => {
    if (!open || !phone) {
      setConversations([]);
      setFollowups([]);
      setFollowMessage("");
      setScheduledAtLocal("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setConvLoading(true);
      setFollowLoading(true);
      try {
        const [c, f] = await Promise.all([
          getWpConversationsForPhone(phone),
          getWpFollowupsForPhone(phone),
        ]);
        if (!cancelled) {
          setConversations(c);
          setFollowups(f);
        }
      } catch (e) {
        if (!cancelled) toast.error("Failed to load lead details", { description: (e as Error).message });
      } finally {
        if (!cancelled) {
          setConvLoading(false);
          setFollowLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, phone]);

  const venueDisplay = useMemo(() => {
    if (!lead) return null;
    return lead.venue || metaString(lead.metadata, "venue");
  }, [lead]);

  const summaryFields = useMemo(() => {
    const m = lead?.metadata;
    if (!m || typeof m !== "object") return [];
    const keys: Array<[string, string]> = [
      ["guest_count", "Guest count"],
      ["event_date", "Event date"],
      ["services_needed", "Services needed"],
      ["indoor_outdoor", "Indoor / outdoor"],
      ["theme", "Theme"],
      ["package_type", "Package type"],
      ["function_list", "Function list"],
      ["preferred_call_time", "Preferred call time"],
      ["city", "City"],
    ];
    return keys.map(([key, label]) => ({ label, value: metaString(m as Record<string, unknown>, key) }));
  }, [lead?.metadata]);

  const refreshFollowups = async () => {
    if (!phone) return;
    setFollowLoading(true);
    try {
      setFollowups(await getWpFollowupsForPhone(phone));
    } catch (e) {
      toast.error("Failed to refresh follow-ups", { description: (e as Error).message });
    } finally {
      setFollowLoading(false);
    }
  };

  const onSchedule = async () => {
    if (!phone) {
      toast.error("This lead has no phone number");
      return;
    }
    const msg = followMessage.trim();
    if (!msg) {
      toast.error("Enter a message");
      return;
    }
    if (!scheduledAtLocal) {
      toast.error("Pick a date and time");
      return;
    }
    const scheduled_at = new Date(scheduledAtLocal).toISOString();
    setScheduling(true);
    try {
      await scheduleWpFollowup({ phone, message: msg, scheduled_at });
      toast.success("Follow-up scheduled");
      setFollowMessage("");
      setScheduledAtLocal("");
      await refreshFollowups();
    } catch (e) {
      toast.error("Schedule failed", { description: (e as Error).message });
    } finally {
      setScheduling(false);
    }
  };

  const onSendNowFollowup = async () => {
    if (!phone) {
      toast.error("This lead has no phone number");
      return;
    }
    const msg = followMessage.trim();
    if (!msg) {
      toast.error("Enter a message");
      return;
    }
    setScheduling(true);
    try {
      await scheduleWpFollowup({ phone, message: msg, send_now: true });
      toast.success("Message sent");
      setFollowMessage("");
      await refreshFollowups();
    } catch (e) {
      toast.error("Send failed", { description: (e as Error).message });
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden max-h-[100dvh]"
      >
        {!lead ? (
          <div className="p-6">
            <SheetHeader>
              <SheetTitle>Lead</SheetTitle>
              <SheetDescription>No lead selected.</SheetDescription>
            </SheetHeader>
          </div>
        ) : (
          <>
            <SheetHeader className="p-4 sm:p-6 pb-3 border-b border-border/60 shrink-0 text-left space-y-1">
              <SheetTitle className="pr-10">{lead.name || "Unknown"}</SheetTitle>
              <SheetDescription className="break-words">
                {lead.phone || "No phone"}
                {lead.email ? ` • ${lead.email}` : ""}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
              <div className="px-4 pt-3 shrink-0 border-b border-border/40">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 justify-start bg-muted/40 p-1">
                  <TabsTrigger value="details" className="text-xs sm:text-sm">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="conversation" className="text-xs sm:text-sm">
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="text-xs sm:text-sm">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="text-xs sm:text-sm">
                    Follow-up
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="flex-1 min-h-0 overflow-y-auto mt-0 p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{lead.event_type || "General"}</Badge>
                  <Badge variant="outline">{lead.source_channel || "—"}</Badge>
                  <Badge>{lead.status}</Badge>
                  {lead.urgency_level ? (
                    <Badge variant="secondary">{lead.urgency_level}</Badge>
                  ) : null}
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Lead score</dt>
                    <dd className="font-medium">{lead.lead_score ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Venue</dt>
                    <dd className="font-medium break-words">{venueDisplay || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-xs">Created</dt>
                    <dd className="font-medium">{new Date(lead.created_at).toLocaleString()}</dd>
                  </div>
                  {lead.last_message ? (
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground text-xs">Last message</dt>
                      <dd className="font-medium bg-muted/30 rounded-lg p-3 mt-1 whitespace-pre-wrap break-words">
                        {lead.last_message}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </TabsContent>

              <TabsContent value="conversation" className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                  {convLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No messages yet.</p>
                  ) : (
                    conversations.map((row) => {
                      const inbound = String(row.direction).toLowerCase() === "inbound";
                      return (
                        <div key={row.id} className={cn("flex", inbound ? "justify-start" : "justify-end")}>
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm border",
                              inbound
                                ? "bg-muted/80 border-border/60 rounded-tl-sm"
                                : "bg-primary text-primary-foreground border-primary rounded-tr-sm"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{row.message}</p>
                            <p
                              className={cn(
                                "text-[10px] mt-1.5 opacity-80",
                                inbound ? "text-muted-foreground" : "text-primary-foreground/80"
                              )}
                            >
                              {new Date(row.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="flex-1 min-h-0 overflow-y-auto mt-0 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summaryFields.map(({ label, value }) => (
                    <SummaryCard key={label} label={label} value={value} />
                  ))}
                </div>
                {!summaryFields.some((s) => s.value) ? (
                  <p className="text-sm text-muted-foreground mt-4">No summary metadata on this lead.</p>
                ) : null}
              </TabsContent>

              <TabsContent value="followup" className="flex-1 min-h-0 overflow-y-auto mt-0 p-4 sm:p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Scheduled follow-ups</h4>
                  {followLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : followups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None scheduled.</p>
                  ) : (
                    <ul className="space-y-2">
                      {followups.map((f) => (
                        <li key={f.id} className="rounded-lg border border-border/60 p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline">{f.status}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(f.scheduled_at).toLocaleString()}
                            </span>
                          </div>
                          {f.message ? <p className="break-words text-muted-foreground">{f.message}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Schedule new</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="wp-follow-msg">Message</Label>
                    <Textarea
                      id="wp-follow-msg"
                      rows={4}
                      value={followMessage}
                      onChange={(e) => setFollowMessage(e.target.value)}
                      placeholder="WhatsApp message to send"
                      className="resize-none"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="wp-follow-when">Scheduled at</Label>
                    <Input
                      id="wp-follow-when"
                      type="datetime-local"
                      value={scheduledAtLocal}
                      onChange={(e) => setScheduledAtLocal(e.target.value)}
                      className="h-11 sm:h-10"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      className="flex-1 h-11 sm:h-10"
                      onClick={() => void onSchedule()}
                      disabled={scheduling}
                    >
                      {scheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 h-11 sm:h-10"
                      onClick={() => void onSendNowFollowup()}
                      disabled={scheduling}
                    >
                      Send now
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
