// Garden Care service worker — installability + icon badge
const CACHE = 'garden-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Pages tell the worker the current due count; the worker owns the icon badge.
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'badge') setBadge(d.count);
});

// A push from a scheduling service can wake the worker and badge the icon
// even when the app is closed.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  const count = d.count || 0;
  e.waitUntil((async () => {
    setBadge(count);
    if (d.title) {
      await self.registration.showNotification(d.title, {
        body: d.body || '',
        icon: './icon-180.png',
        badge: './icon-180.png',
        tag: 'garden-tasks'
      });
    }
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.length) return all[0].focus();
    return self.clients.openWindow('./Garden App.dc.html');
  })());
});

function setBadge(n) {
  if (!self.navigator) return;
  try { n > 0 ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge(); } catch (e) {}
}
