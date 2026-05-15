// @ts-nocheck
/**
 * Proxies authenticated admin calls to the Railway WhatsApp agent (avoids browser CORS).
 *
 * Secrets (Supabase → Edge Functions → Secrets):
 *   WP_AGENT_BASE_URL — e.g. https://phoenix-whatsapp-agent-production.up.railway.app
 *   WP_ADMIN_SECRET   — same value as Railway WP_ADMIN_SECRET (optional)
 */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PATHS = new Set([
  "/schedule-followup",
  "/process-followups",
  "/admin-send-media",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const base = (Deno.env.get("WP_AGENT_BASE_URL") || "").replace(/\/$/, "");
  if (!base) {
    return new Response(JSON.stringify({ error: "WP_AGENT_BASE_URL not configured on Edge Function" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { path?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const path = body.path || "";
  if (!ALLOWED_PATHS.has(path)) {
    return new Response(JSON.stringify({ error: "Path not allowed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminSecret = Deno.env.get("WP_ADMIN_SECRET") || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminSecret) headers["x-wp-admin-secret"] = adminSecret;

  try {
    const upstream = await fetch(`${base}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body.payload ?? {}),
    });
    const text = await upstream.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { raw: text };
    }
    return new Response(JSON.stringify(parsed), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
