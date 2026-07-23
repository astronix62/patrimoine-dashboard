// =====================================================================
// Service Worker — Patrimoine Dashboard
// À placer à la RACINE de ton repo GitHub (même niveau qu'index.html)
// =====================================================================

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(clients.claim()));

// ── Réception d'un message push ─────────────────────────────────────
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch(e) { data = { title: 'Patrimoine', body: event.data ? event.data.text() : '' }; }

  const title   = data.title  || 'Patrimoine Dashboard';
  const options = {
    body:    data.body   || '',
    icon:    data.icon   || './favicon.ico',
    badge:   data.badge  || './favicon.ico',
    tag:     data.tag    || 'patrimoine-notif',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || self.location.origin }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Clic → ouvre / focus le site ────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.location.origin;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
