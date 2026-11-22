// @ts-nocheck
/**
 * Supabase Edge Function: send Web Push + FCM HTTP v1 for:
 *   - INSERT on public.inquiries (inquiry / access OTP / Instagram)
 *   - INSERT on public.wp_notifications (WhatsApp / SLA alerts)
 * Invoke via Database Webhook with header:
 *   x-phoenix-webhook-secret: <WEBHOOK_SECRET>
 *
 * Secrets (Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto), WEBHOOK_SECRET,
 *   VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
 *   FCM_SERVICE_ACCOUNT_JSON (Firebase service account private key JSON — HTTP v1)
 *   Optional fallback: FCM_SERVER_KEY (legacy, usually disabled on new projects)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';

const FCM_CHANNEL_ID = 'phoenix_admin';

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

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function normalizePhoneDigits(phone: unknown): string {
  let digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) digits = `91${digits.slice(1)}`;
  return digits;
}

function formatPhoneDisplay(phone: unknown): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length === 10) return `${local.slice(0, 5)} ${local.slice(5)}`;
  return local;
}

function buildWhatsAppOtpUrl(phone: unknown, name: unknown, otp: unknown): string {
  const normalized = normalizePhoneDigits(phone);
  if (!normalized || !otp) return '';
  const first = String(name ?? 'there').trim().split(/\s+/)[0] || 'there';
  const message = `Hey ${first}, your Phoenix Events website OTP is: ${otp}. Please don't share it with anyone.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function base64Url(data: Uint8Array | string): string {
  const bytes =
    typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64Url(new Uint8Array(signature))}`;

  const tokenRes = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(`FCM token exchange failed: ${JSON.stringify(tokenJson)}`);
  }
  return String(tokenJson.access_token);
}

async function sendFcmHttpV1(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ ok: boolean; status: number; bodyText: string }> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          data,
          android: {
            priority: 'HIGH',
            notification: {
              sound: 'default',
              channel_id: FCM_CHANNEL_ID,
              click_action: 'FCM_PLUGIN_ACTIVITY',
              default_vibrate_timings: true,
              notification_priority: 'PRIORITY_MAX',
            },
          },
        },
      }),
    },
  );
  const bodyText = await res.text();
  return { ok: res.ok, status: res.status, bodyText };
}

async function sendFcmLegacy(
  serverKey: string,
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ ok: boolean; status: number; bodyText: string }> {
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      priority: 'high',
      notification: {
        title,
        body,
        sound: 'default',
        click_action: 'FCM_PLUGIN_ACTIVITY',
      },
      data,
    }),
  });
  const bodyText = await res.text();
  return { ok: res.ok, status: res.status, bodyText };
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
  const internal = Deno.env.get('INTERNAL_PUSH_SECRET') ?? '';
  const authHeader = req.headers.get('authorization') ?? '';
  const serviceKeyEarly = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceAuthOk =
    Boolean(serviceKeyEarly) &&
    (authHeader === `Bearer ${serviceKeyEarly}` || authHeader === `bearer ${serviceKeyEarly}`);
  const secretOk =
    (Boolean(expected) && secret === expected) || (Boolean(internal) && secret === internal);
  if (!secretOk && !serviceAuthOk) {
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

  const fcmSaRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') ?? '';
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY') ?? '';
  let serviceAccount: ServiceAccount | null = null;
  if (fcmSaRaw) {
    try {
      serviceAccount = JSON.parse(fcmSaRaw) as ServiceAccount;
    } catch (e) {
      console.error('send-inquiry-push: invalid FCM_SERVICE_ACCOUNT_JSON', e);
    }
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
  console.info('send-inquiry-push: webhook received', { eventType, table, schema });

  const allowedTables = new Set(['inquiries', 'wp_notifications']);
  if (eventType !== 'INSERT' || !allowedTables.has(table) || schema !== 'public') {
    console.info('send-inquiry-push: skipped webhook', { eventType, table, schema });
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rec = body.record ?? body.new ?? {};
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let title = 'Phoenix Admin';
  let bodyText = 'New alert';
  let notificationTopic = 'alert';
  let dashboardUrl = '/admin/notifications';
  let whatsappUrl = '';
  let actions = false;
  let kind = 'alert';
  let personName = '';
  let personPhone = '';

  if (table === 'wp_notifications') {
    const id = String(rec.id ?? '');
    const leadName = String(rec.lead_name ?? 'WhatsApp lead');
    const nType = String(rec.type ?? 'new_lead');
    const message = String(rec.message ?? '');
    const leadPhone = rec.lead_phone != null ? String(rec.lead_phone) : '';
    const phoneLabel = formatPhoneDisplay(leadPhone);
    personName = leadName;
    personPhone = leadPhone;
    kind = nType === 'sla_reply_due' ? 'wp_sla' : 'wp_lead';
    title =
      nType === 'sla_reply_due'
        ? `Reply due · ${leadName}`
        : `WhatsApp · ${leadName}`;
    bodyText = (
      phoneLabel
        ? `${phoneLabel} · ${message || 'Tap to open chat'}`
        : message || `New WhatsApp alert for ${leadName}`
    ).slice(0, 180);
    notificationTopic = id
      ? `wp-${id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 28)}`
      : 'wp-alert';
    dashboardUrl = `/admin/notifications?tab=wp${
      leadPhone ? `&leadPhone=${encodeURIComponent(leadPhone)}` : ''
    }`;
  } else {
    const id = String(rec.id ?? '');
    const name = String(rec.name ?? 'Someone');
    const inquiryType = rec.event_type != null ? String(rec.event_type) : '';
    const accessToken = rec.access_token != null ? String(rec.access_token) : '';
    const instagramId = rec.instagram_id != null ? String(rec.instagram_id).trim() : '';

    let accessRequestId = '';
    let otpCode = '';
    let visitorPhone = rec.phone != null ? String(rec.phone) : '';

    if (accessToken) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: accessRow } = await admin
          .from('site_access_requests')
          .select('id, otp_code, visitor_phone, visitor_name')
          .eq('access_token', accessToken)
          .maybeSingle();
        if (accessRow?.id) {
          accessRequestId = String(accessRow.id);
          otpCode = String(accessRow.otp_code ?? '');
          if (accessRow.visitor_phone) visitorPhone = String(accessRow.visitor_phone);
          break;
        }
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }

    const isAccess = Boolean(accessToken);
    personName = name;
    personPhone = visitorPhone;
    const phoneLabel = formatPhoneDisplay(visitorPhone);

    if (isAccess) {
      kind = 'otp';
      title = `OTP · ${name}`;
      bodyText = phoneLabel
        ? `${phoneLabel} · Tap Send OTP to open WhatsApp`
        : `Tap Send OTP to open WhatsApp for ${name.split(/\s+/)[0] || name}`;
      actions = true;
      whatsappUrl = buildWhatsAppOtpUrl(visitorPhone, name, otpCode);
    } else if (instagramId) {
      kind = 'instagram';
      title = inquiryType ? `Instagram · ${inquiryType}` : 'Instagram inquiry';
      bodyText = `${name}${instagramId ? ` · @${instagramId.replace(/^@/, '')}` : ''}${
        phoneLabel ? ` · ${phoneLabel}` : ''
      }`.slice(0, 180);
    } else {
      kind = 'inquiry';
      title = inquiryType ? `New ${inquiryType} inquiry` : 'New inquiry';
      bodyText = `${name}${phoneLabel ? ` · ${phoneLabel}` : ''} · Tap to open`.slice(0, 180);
    }

    notificationTopic = id
      ? `inq-${id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 28)}`
      : 'inquiry';

    dashboardUrl = accessRequestId
      ? `/admin/dashboard?otp=${accessRequestId}`
      : isAccess
        ? '/admin/dashboard'
        : id
          ? `/admin/notifications?tab=inquiries&open=${id}`
          : '/admin/notifications?tab=inquiries';
  }

  const absoluteUrl = `https://phoenixeventsandproduction.com${dashboardUrl}`;

  const payload = JSON.stringify({
    title,
    body: bodyText,
    url: dashboardUrl,
    tag: notificationTopic,
    whatsappUrl,
    actions,
    kind,
    name: personName,
    phone: personPhone,
  });

  const { data: rows, error } = await admin.from('admin_push_subscriptions').select('id, subscription');

  if (error) {
    console.error('send-inquiry-push: select subscriptions', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const subscriptions = rows ?? [];
  console.info('send-inquiry-push: subscriptions loaded', { total: subscriptions.length });
  let sent = 0;
  let removed = 0;

  for (const row of subscriptions) {
    const sub = row.subscription as Record<string, unknown> | null;
    if (!sub || typeof sub.endpoint !== 'string' || !row.id) continue;
    try {
      await webpush.sendNotification(
        sub as unknown as Parameters<typeof webpush.sendNotification>[0],
        payload,
        {
          TTL: 60 * 60 * 24,
          urgency: 'high',
          topic: notificationTopic,
        },
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

  let fcmSent = 0;
  let fcmRemoved = 0;
  let fcmSkipped = !(serviceAccount || fcmServerKey);
  let fcmAccessToken = '';

  if (serviceAccount?.project_id && serviceAccount?.client_email && serviceAccount?.private_key) {
    try {
      fcmAccessToken = await getFcmAccessToken(serviceAccount);
    } catch (e) {
      console.error('send-inquiry-push: FCM access token failed', e);
    }
  }

  if (fcmAccessToken || fcmServerKey) {
    const { data: fcmRows, error: fcmErr } = await admin
      .from('admin_fcm_devices')
      .select('id, token');

    if (fcmErr) {
      console.error('send-inquiry-push: select fcm devices', fcmErr);
    } else {
      const devices = fcmRows ?? [];
      console.info('send-inquiry-push: fcm devices loaded', { total: devices.length });
      for (const device of devices) {
        if (!device?.token || !device?.id) continue;
        try {
          const dataPayload = {
            url: absoluteUrl,
            path: dashboardUrl,
            tag: notificationTopic,
            whatsappUrl: whatsappUrl || '',
            // Default tap on OTP opens WhatsApp (Send OTP). Other kinds open the admin path.
            action: whatsappUrl ? 'send-otp' : 'open',
            kind,
            name: personName,
            phone: personPhone,
            title,
            body: bodyText,
          };
          const result = fcmAccessToken && serviceAccount
            ? await sendFcmHttpV1(
                fcmAccessToken,
                serviceAccount.project_id,
                device.token,
                title,
                bodyText,
                dataPayload,
              )
            : await sendFcmLegacy(fcmServerKey, device.token, title, bodyText, dataPayload);

          if (result.ok) {
            fcmSent++;
          } else if (
            result.status === 404 ||
            /NotRegistered|InvalidRegistration|UNREGISTERED|NOT_FOUND/i.test(result.bodyText)
          ) {
            await admin.from('admin_fcm_devices').delete().eq('id', device.id);
            fcmRemoved++;
          } else {
            console.warn('send-inquiry-push: fcm failed', result.status, result.bodyText.slice(0, 300));
          }
        } catch (e) {
          console.warn('send-inquiry-push: fcm exception', e);
        }
      }
    }
  } else {
    console.info(
      'send-inquiry-push: FCM not configured — set FCM_SERVICE_ACCOUNT_JSON (HTTP v1) for Android APK push',
    );
  }

  console.info('send-inquiry-push: push-result', {
    webTotal: subscriptions.length,
    sent,
    removed,
    fcmSent,
    fcmRemoved,
    fcmSkipped,
    fcmMode: fcmAccessToken ? 'http_v1' : fcmServerKey ? 'legacy' : 'none',
  });

  return new Response(
    JSON.stringify({
      ok: true,
      sent,
      removed,
      total: subscriptions.length,
      fcmSent,
      fcmRemoved,
      fcmSkipped,
      fcmMode: fcmAccessToken ? 'http_v1' : fcmServerKey ? 'legacy' : 'none',
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
