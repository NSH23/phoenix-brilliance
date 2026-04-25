// @ts-nocheck
/**
 * Supabase Edge Function: send Web Push to all saved admin subscriptions when a new inquiry is inserted.
 * Invoke via Database Webhook (INSERT on public.inquiries) with header:
 *   x-phoenix-webhook-secret: <WEBHOOK_SECRET>
 *
 * Secrets (Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto), WEBHOOK_SECRET,
 *   VAPID_SUBJECT (e.g. mailto:you@domain.com), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-phoenix-webhook-secret',
};

type DbWebhookBody = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown>;
};

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return new Response('Server misconfigured', { status: 500, headers: corsHeaders });
  }

  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? '';
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  if (!vapidSubject || !vapidPublic || !vapidPrivate) {
    return new Response('VAPID not configured', { status: 500, headers: corsHeaders });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let body: DbWebhookBody;
  try {
    body = (await req.json()) as DbWebhookBody;
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  if (body.type !== 'INSERT' || body.table !== 'inquiries' || body.schema !== 'public') {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rec = body.record ?? {};
  const id = String(rec.id ?? '');
  const name = String(rec.name ?? 'Someone');
  const eventType = rec.event_type != null ? String(rec.event_type) : '';
  const message = rec.message != null ? String(rec.message) : '';

  const title = eventType ? `New ${eventType} inquiry` : 'New inquiry';
  const bodyText = `${name}: ${message || 'Open Phoenix Admin'}`.slice(0, 180);

  const payload = JSON.stringify({
    title,
    body: bodyText,
    url: '/admin/inquiries',
    tag: id ? `inquiry-${id}` : 'inquiry',
  });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: rows, error } = await admin.from('admin_push_subscriptions').select('id, subscription');

  if (error) {
    console.error('send-inquiry-push: select subscriptions', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const subscriptions = rows ?? [];
  let sent = 0;
  let removed = 0;

  for (const row of subscriptions) {
    const sub = row.subscription as Record<string, unknown> | null;
    if (!sub || typeof sub.endpoint !== 'string' || !row.id) continue;
    try {
      await webpush.sendNotification(
        sub as unknown as Parameters<typeof webpush.sendNotification>[0],
        payload,
        { TTL: 86_400 }
      );
      sent++;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) {
        await admin.from('admin_push_subscriptions').delete().eq('id', row.id);
        removed++;
      } else {
        console.warn('send-inquiry-push: send failed', status, e);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, removed, total: subscriptions.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
