self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = {
      title: 'Phoenix Admin',
      body: 'New inquiry',
      url: '/admin/inquiries',
      tag: 'inquiry',
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

    await self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: payload.tag || 'inquiry',
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: payload.url || '/admin/inquiries' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/admin/inquiries';

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
