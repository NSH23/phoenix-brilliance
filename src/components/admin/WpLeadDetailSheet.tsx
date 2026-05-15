import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, FileText, ImageIcon, Loader2, MessageSquare, Paperclip, Send, Video } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getWpConversationsForPhone,
  getWpFollowupsForPhone,
  scheduleWpFollowup,
  sendWpAdminMedia,
  type WpConversation,
  type WpFollowup,
  type WpLead,
} from "@/services/wpAgent";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export type WpLeadDetailSheetProps = {
  lead: WpLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DetailTab = "details" | "conversation" | "summary" | "followup";

function metaString(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = metadata?.[key];
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String).filter(Boolean).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function mediaUrlFromMeta(metadata: Record<string, unknown> | null | undefined): string | null {
  const u = metadata?.media_url;
  return typeof u === "string" && u.startsWith("http") ? u : null;
}

function ConversationBubble({ row }: { row: WpConversation }) {
  const inbound = String(row.direction).toLowerCase() === "inbound";
  const mt = (row.message_type || "text").toLowerCase();
  const mediaUrl = mediaUrlFromMeta(row.metadata);
  const isImage = mt === "image" && mediaUrl;
  const typeLabel =
    mt === "image" ? "Photo" : mt === "video" ? "Video" : mt === "document" ? "Document" : null;
  const source = row.metadata?.source;

  return (
    <div className={cn("flex", inbound ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm border",
          inbound
            ? "bg-muted/80 border-border/60 rounded-tl-sm"
            : "bg-primary text-primary-foreground border-primary rounded-tr-sm"
        )}
      >
        {typeLabel ? (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide mb-1",
              inbound ? "text-muted-foreground" : "text-primary-foreground/90"
            )}
          >
            {mt === "image" ? <ImageIcon className="w-3 h-3" /> : null}
            {mt === "video" ? <Video className="w-3 h-3" /> : null}
            {mt === "document" ? <FileText className="w-3 h-3" /> : null}
            {typeLabel}
            {source === "admin" ? " · Admin" : source === "agent" ? " · Agent" : null}
          </div>
        ) : null}
        {isImage ? (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="block mb-1.5">
            <img
              src={mediaUrl}
              alt=""
              className="rounded-lg max-h-40 w-full object-cover border border-border/40"
            />
          </a>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{row.message}</p>
        {mt === "document" && mediaUrl ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-xs underline mt-1 inline-block",
              inbound ? "text-primary" : "text-primary-foreground"
            )}
          >
            Open file
          </a>
        ) : null}
        {mt === "video" && mediaUrl && !isImage ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-xs underline mt-1 inline-block",
              inbound ? "text-primary" : "text-primary-foreground"
            )}
          >
            Open video / link
          </a>
        ) : null}
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
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [conversations, setConversations] = useState<WpConversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [followups, setFollowups] = useState<WpFollowup[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followMessage, setFollowMessage] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaSending, setMediaSending] = useState(false);
  const [mediaProgress, setMediaProgress] = useState(0);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const phone = lead?.phone ?? "";

  const reloadConversations = async () => {
    if (!phone) return;
    setConversations(await getWpConversationsForPhone(phone));
  };

  useEffect(() => {
    if (!open || !phone) {
      setConversations([]);
      setFollowups([]);
      setFollowMessage("");
      setScheduledAtLocal("");
      setMediaFile(null);
      setMediaCaption("");
      setMediaProgress(0);
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

  const hasSummaryData = useMemo(() => {
    if (!lead) return false;
    if (summaryFields.some((s) => s.value)) return true;
    return Boolean(
      lead.event_type ||
        venueDisplay ||
        lead.package_type ||
        lead.lead_score != null ||
        lead.urgency_level
    );
  }, [lead, summaryFields, venueDisplay]);

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
      await reloadConversations();
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
      await reloadConversations();
    } catch (e) {
      toast.error("Send failed", { description: (e as Error).message });
    } finally {
      setScheduling(false);
    }
  };

  const onSendMedia = async () => {
    if (!phone) {
      toast.error("This lead has no phone number");
      return;
    }
    if (!mediaFile) {
      toast.error("Choose a photo, video, or document");
      return;
    }
    setMediaSending(true);
    setMediaProgress(0);
    try {
      const url = await uploadToCloudinary(mediaFile, "wp-agent-media", setMediaProgress);
      const mediaType = mediaFile.type.startsWith("video/")
        ? "video"
        : mediaFile.type.startsWith("image/")
          ? "image"
          : "document";
      await sendWpAdminMedia({
        phone,
        media_type: mediaType,
        url,
        caption: mediaCaption.trim() || undefined,
        filename: mediaFile.name,
      });
      toast.success("Media sent on WhatsApp");
      setMediaFile(null);
      setMediaCaption("");
      if (mediaInputRef.current) mediaInputRef.current.value = "";
      await reloadConversations();
    } catch (e) {
      toast.error("Send failed", { description: (e as Error).message });
    } finally {
      setMediaSending(false);
      setMediaProgress(0);
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

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as DetailTab)}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="px-3 py-2 shrink-0 border-b border-border/40 bg-background">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-muted/40 p-1">
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

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
              {activeTab === "details" && (
              <div className="space-y-4">
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
              </div>
              )}

              {activeTab === "conversation" && (
              <div className="space-y-3 min-h-[200px]">
                  {convLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No messages yet.</p>
                  ) : (
                    conversations.map((row) => <ConversationBubble key={row.id} row={row} />)
                  )}
                </div>
              )}

              {activeTab === "summary" && (
              <div className="space-y-3">
                {!hasSummaryData ? (
                  <p className="text-sm text-muted-foreground text-center py-6 rounded-lg border border-dashed border-border/60 bg-muted/15">
                    No extra details collected yet from WhatsApp.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <SummaryCard label="Event" value={lead.event_type} />
                      <SummaryCard label="Venue" value={venueDisplay} />
                      <SummaryCard label="Package" value={lead.package_type} />
                      <SummaryCard
                        label="Lead score"
                        value={lead.lead_score != null ? String(lead.lead_score) : null}
                      />
                      <SummaryCard label="Priority" value={lead.urgency_level} />
                      <SummaryCard label="Source" value={lead.source_channel} />
                    </div>
                    {summaryFields.some((s) => s.value) ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">From conversation</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {summaryFields.map(({ label, value }) => (
                            <SummaryCard key={label} label={label} value={value} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              )}

              {activeTab === "followup" && (
              <div className="space-y-3">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-primary" />
                      Scheduled
                      {followups.length > 0 ? (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {followups.length}
                        </Badge>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
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
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      New message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="wp-follow-msg" className="text-xs">
                        Message
                      </Label>
                      <Textarea
                        id="wp-follow-msg"
                        rows={3}
                      value={followMessage}
                      onChange={(e) => setFollowMessage(e.target.value)}
                      placeholder="WhatsApp message to send"
                        className="resize-none text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="wp-follow-when" className="text-xs">
                        Schedule for
                      </Label>
                    <Input
                      id="wp-follow-when"
                      type="datetime-local"
                      value={scheduledAtLocal}
                      onChange={(e) => setScheduledAtLocal(e.target.value)}
                        className="h-11 sm:h-10"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        type="button"
                        className="h-11 sm:h-10"
                        onClick={() => void onSchedule()}
                        disabled={scheduling}
                      >
                        {scheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Schedule
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 sm:h-10"
                        onClick={() => void onSendNowFollowup()}
                        disabled={scheduling}
                      >
                        <Send className="w-4 h-4 mr-2 shrink-0" />
                        Send now
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <Label className="text-xs flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        Send photo, video, or document
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Uploads go to Cloudinary (wp-agent-media), then WhatsApp. Shown in Conversation tab.
                      </p>
                      <Input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        className="h-11 text-sm"
                        disabled={mediaSending}
                        onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                      />
                      {mediaFile ? (
                        <p className="text-xs text-muted-foreground truncate">{mediaFile.name}</p>
                      ) : null}
                      <Input
                        placeholder="Caption (optional)"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        className="h-10 text-sm"
                        disabled={mediaSending}
                      />
                      {mediaSending && mediaProgress > 0 ? (
                        <Progress value={mediaProgress} className="h-1.5" />
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11"
                        disabled={mediaSending || !mediaFile}
                        onClick={() => void onSendMedia()}
                      >
                        {mediaSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4 mr-2" />
                        )}
                        Send media
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}
              </div>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
