import { endOfDay, startOfDay, endOfWeek, startOfWeek, subWeeks } from "date-fns";
import { supabase } from "@/lib/supabase";

export type WpLeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface WpLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: WpLeadStatus;
  event_type: string | null;
  package_type: string | null;
  urgency_level: string | null;
  lead_score: number | null;
  source_channel: string | null;
  venue: string | null;
  next_follow_up: string | null;
  last_message: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WpNotification {
  id: string;
  type: string;
  priority: string;
  message: string;
  lead_name: string | null;
  lead_phone: string | null;
  is_read: boolean;
  scheduled_for: string | null;
  created_at: string;
}

export interface WpDashboardSummary {
  totalLeads: number;
  newLeads: number;
  highPriorityLeads: number;
  callbacksDue: number;
  avgLeadScore: number;
}

export interface WpConversation {
  id: string;
  lead_phone: string | null;
  direction: "inbound" | "outbound";
  message: string;
  message_type: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface WpFollowupMediaMeta {
  media_type?: "image" | "video" | "document";
  media_url?: string;
  filename?: string;
  caption?: string;
}

export interface WpFollowup {
  id: string;
  lead_phone: string;
  message: string | null;
  scheduled_at: string;
  status: string;
  created_at: string;
  metadata?: WpFollowupMediaMeta | null;
}

const DEFAULT_WP_SCHEDULE_FOLLOWUP =
  "https://whatsapp-agentindexjs-production.up.railway.app/schedule-followup";

/** Optional override: `VITE_WP_SCHEDULE_FOLLOWUP_URL` (full URL to `/schedule-followup`). */
export const WP_SCHEDULE_FOLLOWUP_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WP_SCHEDULE_FOLLOWUP_URL?.trim()) ||
  DEFAULT_WP_SCHEDULE_FOLLOWUP;

/** Last 10 digits and optional `91` prefix — matches website storage vs WhatsApp `from` formats. */
export function wpLeadPhoneKeyVariants(phone: string): string[] {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return [];
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return [digits];
  return Array.from(new Set([last10, `91${last10}`]));
}

/** True when two stored / WhatsApp phone keys refer to the same subscriber (10 vs 91…). */
export function wpPhonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const va = wpLeadPhoneKeyVariants(a);
  const vb = wpLeadPhoneKeyVariants(b);
  return va.some((x) => vb.includes(x));
}

export function getWpAgentBaseUrl(): string {
  try {
    return new URL(WP_SCHEDULE_FOLLOWUP_URL).origin;
  } catch {
    return "";
  }
}

/** Use Supabase Edge proxy by default (fixes CORS from admin site → Railway). Set VITE_WP_AGENT_DIRECT=1 to call Railway from browser. */
const WP_AGENT_DIRECT =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_WP_AGENT_DIRECT === "1";

const WP_ADMIN_SECRET =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WP_AGENT_ADMIN_SECRET?.trim()) || "";

function wpAgentFetchHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (WP_ADMIN_SECRET) headers["x-wp-admin-secret"] = WP_ADMIN_SECRET;
  return headers;
}

function parseAgentError(data: unknown, status: number, statusText: string): void {
  if (status >= 200 && status < 300) return;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
  throw new Error(statusText || `Request failed (${status})`);
}

/** Calls Railway via Edge Function (no browser CORS) or direct fetch when VITE_WP_AGENT_DIRECT=1. */
async function callWpAgent(path: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (!WP_AGENT_DIRECT) {
    const { data, error } = await supabase.functions.invoke("wp-agent-proxy", {
      body: { path, payload },
    });
    if (error) throw error;
    if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
      throw new Error(String((data as { error: unknown }).error));
    }
    return;
  }

  const base = getWpAgentBaseUrl();
  if (!base) throw new Error("WP agent base URL is not configured");
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: wpAgentFetchHeaders(),
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  parseAgentError(parsed, res.status, text || res.statusText);
}

/** Triggers the Railway agent POST /process-followups (sends due wp_followups rows). */
export async function triggerWpProcessFollowups(): Promise<void> {
  await callWpAgent("/process-followups", {});
}

export async function sendWpAdminMedia(payload: {
  phone: string;
  media_type: "text" | "image" | "video" | "document";
  message?: string;
  url?: string;
  caption?: string;
  filename?: string;
}): Promise<void> {
  await callWpAgent("/admin-send-media", payload as Record<string, unknown>);
}

/** Creates wp_notifications rows for leads awaiting a reply (6h+ since last inbound). */
export async function refreshWpSlaNotifications(): Promise<number> {
  const { data, error } = await supabase.rpc("wp_refresh_sla_notifications");
  if (error) throw error;
  return Number(data ?? 0);
}

const leadColumns =
  "id, name, phone, email, status, event_type, package_type, urgency_level, lead_score, source_channel, venue, next_follow_up, last_message, metadata, created_at, updated_at";

export async function scheduleWpFollowup(payload: {
  phone: string;
  message?: string;
  scheduled_at?: string;
  send_now?: boolean;
  media_type?: "image" | "video" | "document";
  media_url?: string;
  filename?: string;
  caption?: string;
}) {
  await callWpAgent("/schedule-followup", payload as Record<string, unknown>);
}

export async function getWpLeadsPage(
  page: number,
  pageSize: number,
  search: string,
  status: string,
  source: "all" | "website" | "whatsapp" = "all"
) {
  const from = Math.max(page, 0) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("wp_leads")
    .select(leadColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,event_type.ilike.%${search.trim()}%`
    );
  }
  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (source !== "all") {
    query = query.eq("source_channel", source);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    rows: (data || []) as WpLead[],
    total: count ?? 0,
  };
}

/** Lightweight lead facts keyed by phone (no joins elsewhere). */
export async function getWpLeadBriefsByPhones(
  phones: string[]
): Promise<Record<string, { event_type: string | null; source_channel: string | null }>> {
  const uniq = [...new Set(phones.filter(Boolean))];
  if (!uniq.length) return {};
  const { data, error } = await supabase
    .from("wp_leads")
    .select("phone, event_type, source_channel")
    .in("phone", uniq);
  if (error) throw error;
  const map: Record<string, { event_type: string | null; source_channel: string | null }> = {};
  for (const row of data || []) {
    const p = (row as { phone: string | null }).phone;
    if (p)
      map[p] = {
        event_type: (row as { event_type: string | null }).event_type,
        source_channel: (row as { source_channel: string | null }).source_channel,
      };
  }
  return map;
}

export async function getWpLeadByPhone(phone: string): Promise<WpLead | null> {
  const keys = wpLeadPhoneKeyVariants(phone);
  const { data, error } = await supabase
    .from("wp_leads")
    .select(leadColumns)
    .in("phone", keys.length ? keys : [phone])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as WpLead) ?? null;
}

export async function getRecentWpLeads(limit = 5): Promise<WpLead[]> {
  const { data, error } = await supabase
    .from("wp_leads")
    .select(leadColumns)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as WpLead[];
}

export async function getWpLeadSummaryCards(): Promise<{
  totalLeads: number;
  newToday: number;
  websiteLeads: number;
  whatsappLeads: number;
}> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const iso = start.toISOString();

  const [total, newToday, website, whatsapp] = await Promise.all([
    supabase.from("wp_leads").select("*", { count: "exact", head: true }),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).gte("created_at", iso),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).eq("source_channel", "website"),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).eq("source_channel", "whatsapp"),
  ]);

  const errs = [total.error, newToday.error, website.error, whatsapp.error].filter(Boolean);
  if (errs.length) throw errs[0];

  return {
    totalLeads: total.count ?? 0,
    newToday: newToday.count ?? 0,
    websiteLeads: website.count ?? 0,
    whatsappLeads: whatsapp.count ?? 0,
  };
}

export async function updateWpLeadStatus(id: string, status: WpLeadStatus) {
  const { data, error } = await supabase
    .from("wp_leads")
    .update({ status })
    .eq("id", id)
    .select(leadColumns)
    .single();
  if (error) throw error;
  return data as WpLead;
}

export async function deleteWpLeadByPhone(phone: string) {
  if (!phone) throw new Error("Phone is required");
  const keys = wpLeadPhoneKeyVariants(phone);
  if (!keys.length) throw new Error("Invalid phone");

  const del = async (table: string) => {
    const { error } = await supabase.from(table).delete().in("lead_phone", keys);
    if (error) throw error;
  };

  await del("wp_followups");
  await del("wp_conversations");
  await del("wp_notifications");

  const { error: leadErr } = await supabase.from("wp_leads").delete().in("phone", keys);
  if (leadErr) throw leadErr;
}

export async function getWpDashboardSummary(): Promise<WpDashboardSummary> {
  const { data, error } = await supabase.rpc("get_wp_dashboard_summary");
  if (!error && data != null) {
    const row = data as {
      totalLeads?: number;
      newLeads?: number;
      highPriorityLeads?: number;
      callbacksDue?: number;
      avgLeadScore?: number;
    };
    return {
      totalLeads: Number(row?.totalLeads ?? 0),
      newLeads: Number(row?.newLeads ?? 0),
      highPriorityLeads: Number(row?.highPriorityLeads ?? 0),
      callbacksDue: Number(row?.callbacksDue ?? 0),
      avgLeadScore: Number(row?.avgLeadScore ?? 0),
    };
  }

  const nowIso = new Date().toISOString();
  const [totalLeadsRes, newLeadsRes, highPriorityRes, callbacksDueRes] = await Promise.all([
    supabase.from("wp_leads").select("*", { count: "exact", head: true }),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).in("urgency_level", ["high", "urgent"]),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).lte("next_follow_up", nowIso),
  ]);
  const errs = [totalLeadsRes.error, newLeadsRes.error, highPriorityRes.error, callbacksDueRes.error].filter(Boolean);
  if (errs.length > 0) throw errs[0];

  return {
    totalLeads: totalLeadsRes.count ?? 0,
    newLeads: newLeadsRes.count ?? 0,
    highPriorityLeads: highPriorityRes.count ?? 0,
    callbacksDue: callbacksDueRes.count ?? 0,
    avgLeadScore: 0,
  };
}

export async function getWpNotifications(limit = 30) {
  const { data, error } = await supabase
    .from("wp_notifications")
    .select("id, type, priority, message, lead_name, lead_phone, is_read, scheduled_for, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as WpNotification[];
}

export async function markWpNotificationRead(id: string) {
  const { error } = await supabase.from("wp_notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markWpNotificationsReadByIds(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from("wp_notifications").update({ is_read: true }).in("id", ids);
  if (error) throw error;
}

export async function markAllWpNotificationsRead() {
  const { error } = await supabase.from("wp_notifications").update({ is_read: true }).eq("is_read", false);
  if (error) throw error;
}

export async function getWpUnreadNotificationsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("wp_notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function getWpConversationsForPhone(phone: string): Promise<WpConversation[]> {
  if (!phone) return [];
  const keys = wpLeadPhoneKeyVariants(phone);
  const { data, error } = await supabase
    .from("wp_conversations")
    .select("id, lead_phone, direction, message, message_type, metadata, created_at")
    .in("lead_phone", keys.length ? keys : [phone])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as WpConversation[];
}

export async function getWpFollowupsForPhone(phone: string): Promise<WpFollowup[]> {
  if (!phone) return [];
  const keys = wpLeadPhoneKeyVariants(phone);
  const { data, error } = await supabase
    .from("wp_followups")
    .select("id, lead_phone, message, scheduled_at, status, created_at, metadata")
    .in("lead_phone", keys.length ? keys : [phone])
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data || []) as WpFollowup[];
}

const CANCELLABLE_FOLLOWUP_STATUSES = new Set(["pending", "processing"]);

/** Removes a scheduled follow-up before it is sent (pending or in-flight processing only). */
export async function deleteWpFollowup(id: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from("wp_followups")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!row) throw new Error("Follow-up not found");
  if (!CANCELLABLE_FOLLOWUP_STATUSES.has(String(row.status).toLowerCase())) {
    throw new Error("Only scheduled (pending) follow-ups can be cancelled");
  }
  const { error } = await supabase.from("wp_followups").delete().eq("id", id);
  if (error) throw error;
}

export async function getTodaysPendingFollowupsWithNames(): Promise<
  Array<WpFollowup & { lead_name: string | null }>
> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const { data, error } = await supabase
    .from("wp_followups")
    .select("id, lead_phone, message, scheduled_at, status, created_at")
    .eq("status", "pending")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  const rows = (data || []) as WpFollowup[];
  const phones = [...new Set(rows.map((r) => r.lead_phone).filter(Boolean))];
  if (!phones.length) return rows.map((r) => ({ ...r, lead_name: null }));

  const { data: leads, error: le } = await supabase.from("wp_leads").select("phone, name").in("phone", phones);
  if (le) throw le;
  const nameByPhone = new Map((leads || []).map((l: { phone: string | null; name: string }) => [l.phone, l.name]));
  return rows.map((r) => ({ ...r, lead_name: (nameByPhone.get(r.lead_phone) as string | undefined) ?? null }));
}

export async function getTodaysPendingFollowupsCount(): Promise<number> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const { count, error } = await supabase
    .from("wp_followups")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export interface WpAnalyticsRow {
  date: string;
  total_leads: number;
  converted_leads: number;
  contacted_leads: number;
}

export async function getWpAnalytics(days = 14): Promise<WpAnalyticsRow[]> {
  const { data, error } = await supabase
    .from("wp_daily_stats")
    .select("date, total_leads, converted_leads, contacted_leads")
    .order("date", { ascending: false })
    .limit(days);

  if (error) throw error;
  return ((data || []) as WpAnalyticsRow[]).reverse();
}

export async function refreshWpDailyStats(daysBack = 30) {
  const { error } = await supabase.rpc("refresh_wp_daily_stats", { days_back: daysBack });
  if (error) throw error;
}

export async function getWpSourceBreakdown(): Promise<{
  website: number;
  whatsapp: number;
  other: number;
}> {
  const [totalRes, websiteRes, whatsappRes] = await Promise.all([
    supabase.from("wp_leads").select("*", { count: "exact", head: true }),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).eq("source_channel", "website"),
    supabase.from("wp_leads").select("*", { count: "exact", head: true }).eq("source_channel", "whatsapp"),
  ]);
  if (totalRes.error) throw totalRes.error;
  if (websiteRes.error) throw websiteRes.error;
  if (whatsappRes.error) throw whatsappRes.error;
  const total = totalRes.count ?? 0;
  const website = websiteRes.count ?? 0;
  const whatsapp = whatsappRes.count ?? 0;
  const other = Math.max(0, total - website - whatsapp);
  return { website, whatsapp, other };
}

export async function getWpEventTypeCounts(maxRows = 8000): Promise<{ label: string; count: number }[]> {
  const pageSize = 1000;
  let start = 0;
  const tallies: Record<string, number> = {};
  while (start < maxRows) {
    const { data, error } = await supabase
      .from("wp_leads")
      .select("event_type")
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw error;
    const chunk = data || [];
    if (chunk.length === 0) break;
    for (const row of chunk) {
      const k = (row as { event_type: string | null }).event_type?.trim() || "Unknown";
      tallies[k] = (tallies[k] || 0) + 1;
    }
    if (chunk.length < pageSize) break;
    start += pageSize;
  }
  return Object.entries(tallies)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getWpWeeklyLeadComparison(): Promise<{ thisWeek: number; lastWeek: number }> {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prev = subWeeks(now, 1);
  const lastWeekStart = startOfWeek(prev, { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(prev, { weekStartsOn: 1 });

  const [thisWeek, lastWeek] = await Promise.all([
    supabase
      .from("wp_leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisWeekStart.toISOString())
      .lte("created_at", thisWeekEnd.toISOString()),
    supabase
      .from("wp_leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastWeekStart.toISOString())
      .lte("created_at", lastWeekEnd.toISOString()),
  ]);
  if (thisWeek.error) throw thisWeek.error;
  if (lastWeek.error) throw lastWeek.error;
  return { thisWeek: thisWeek.count ?? 0, lastWeek: lastWeek.count ?? 0 };
}
