/* Admin PWA service worker — scope /admin/ (installable on desktop + mobile). */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* Required for Chrome/Edge desktop install prompt; network passthrough. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
