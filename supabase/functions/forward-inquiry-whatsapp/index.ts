// @ts-nocheck
/**
 * Supabase Edge Function: after a website inquiry INSERT, POST payload to the WhatsApp agent
 * `/website-lead` endpoint (same shape as Phoenix WhatsApp Agent index.js).
 *
 * Configure a Database Webhook on `public.inquiries` INSERT → this function URL, with header:
 *   x-phoenix-webhook-secret: <WEBHOOK_SECRET>
 *
 * Edge secrets (Dashboard → Edge Functions → Secrets):
 *   WEBHOOK_SECRET (same as send-inquiry-push),
 *   WA_WEBSITE_LEAD_URL — full URL, e.g. https://your-agent.up.railway.app/website-lead
 */
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-phoenix-webhook-secret',
};

type DbWebhookBody = {
  type?: string;
  eventType?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown>;
  new?: Record<string, unknown>;
};

function normalizePhoneForAgent(raw: string): string {
  let phone = String(raw ?? '').replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  if (phone.startsWith('0')) phone = '91' + phone.slice(1);
  return phone;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const secret = req.headers.get('x-phoenix-webhook-secret') ?? '';
  const expected = Deno.env.get('WEBHOOK_SECRET') ?? '';
  if (!expected || secret !== expected) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const waUrl = (Deno.env.get('WA_WEBSITE_LEAD_URL') ?? '').trim();
  if (!waUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'WA_WEBSITE_LEAD_URL not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: DbWebhookBody;
  try {
    body = (await req.json()) as DbWebhookBody;
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const eventType = String(body.type ?? body.eventType ?? '').toUpperCase();
  const table = String(body.table ?? '');
  const schema = String(body.schema ?? '');

  if (eventType !== 'INSERT' || table !== 'inquiries' || schema !== 'public') {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rec = body.record ?? body.new ?? {};
  const rawPhone = rec.phone != null ? String(rec.phone) : '';
  const phone = normalizePhoneForAgent(rawPhone);
  if (!phone) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no_phone' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const name = rec.name != null ? String(rec.name) : 'Friend';
  const eventTypeVal = rec.event_type != null ? String(rec.event_type) : '';
  const venue = rec.venue != null ? String(rec.venue) : '';

  const payload = {
    name,
    full_name: name,
    phone,
    mobile: phone,
    event: eventTypeVal,
    event_type: eventTypeVal,
    venue,
    venue_name: venue,
  };

  let waStatus = 0;
  let waBody = '';
  try {
    const wres = await fetch(waUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    waStatus = wres.status;
    waBody = (await wres.text()).slice(0, 500);
    if (!wres.ok) {
      console.error('forward-inquiry-whatsapp: agent error', waStatus, waBody);
      return new Response(JSON.stringify({ ok: false, waStatus, waBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('forward-inquiry-whatsapp: fetch failed', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, forwarded: true, waStatus }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
