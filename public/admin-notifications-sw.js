self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = {
      title: 'Phoenix Admin',
      body: 'New access request',
      url: '/admin/dashboard',
      tag: 'access-otp',
      whatsappUrl: '',
      actions: true,
    };
    try {
      if (event.data) {
        try {
          payload = { ...payload, ...event.data.json() };
        } catch {
          const text = await event.data.text();
          if (text) payload = { ...payload, body: text };
        }
      }
    } catch {
      /* ignore parse errors */
    }

    const actions = [];
    if (payload.whatsappUrl) {
      actions.push({ action: 'send-otp', title: 'Send OTP' });
    }
    actions.push({ action: 'open', title: 'Open' });

    await self.registration.showNotification(payload.title || 'Phoenix Admin', {
      body: payload.body,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: payload.tag || 'access-otp',
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      actions: actions.slice(0, 2),
      data: {
        url: payload.url || '/admin/dashboard',
        whatsappUrl: payload.whatsappUrl || '',
      },
    });
  })());
});

function resolveAdminUrl(path) {
  const raw = path || '/admin/dashboard';
  if (/^https?:\/\//i.test(raw)) return raw;
  return new URL(raw.startsWith('/') ? raw : `/${raw}`, self.location.origin).href;
}

self.addEventListener('notificationclick', (event) => {
  const action = event.action || 'open';
  const data = event.notification?.data || {};
  event.notification.close();

  if (action === 'send-otp' && data.whatsappUrl) {
    event.waitUntil((async () => {
      if (self.clients.openWindow) {
        await self.clients.openWindow(data.whatsappUrl);
      }
    })());
    return;
  }

  const targetUrl = resolveAdminUrl(data.url || '/admin/dashboard');

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if ('focus' in client) {
        try {
          await client.focus();
          if ('navigate' in client) await client.navigate(targetUrl);
          return;
        } catch {
          // Continue to fallback openWindow
        }
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
