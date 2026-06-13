// Tombstone service worker.
//
// This app does NOT use a service worker. Older builds (or a previous app on
// this same origin/localhost:3000) registered one that kept serving stale,
// cached assets — e.g. an out-of-date logo — even after a hard refresh.
//
// Browsers still holding that old registration re-fetch /sw.js to check for an
// update. Serving this file lets them update to a worker whose only job is to
// wipe every cache, unregister itself, and reload open tabs. After it runs once
// the registration is gone for good and this file is never requested again.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // ignore — best effort cache cleanup
      }

      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});
