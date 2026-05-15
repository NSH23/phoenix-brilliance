// @ts-nocheck
/**
 * Proxies authenticated admin calls to the Railway WhatsApp agent (avoids browser CORS).
 *
 * Secrets (Supabase → Edge Functions → Secrets):
 *   WP_AGENT_BASE_URL — origin only, e.g. https://whatsapp-agentindexjs-production.up.railway.app
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

/** Use origin only — secrets sometimes include /schedule-followup by mistake. */
function normalizeAgentBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return u.origin;
  } catch {
    return trimmed;
  }
}

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

  const base = normalizeAgentBaseUrl(Deno.env.get("WP_AGENT_BASE_URL") || "");
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

  const upstreamUrl = `${base}${path}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body.payload ?? {}),
    });
    const text = await upstream.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      parsed = { raw: text };
    }

    if (!upstream.ok) {
      const railwayAppMissing =
        upstream.status === 404 &&
        typeof parsed.message === "string" &&
        parsed.message.toLowerCase().includes("application not found");
      if (railwayAppMissing) {
        return new Response(
          JSON.stringify({
            error:
              "Railway returned 404 Application not found. Update Supabase secret WP_AGENT_BASE_URL to your live agent origin (e.g. https://whatsapp-agentindexjs-production.up.railway.app) — not phoenix-whatsapp-agent-production.",
            upstream_status: upstream.status,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
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
