// public/sw.js

const CACHE_NAME = 'tinitiate-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Generic cache-first for all same-origin requests + raw GitHub content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // For GitHub raw URLs (and other cross-origin), use a no-cors Request key
      if (url.hostname === 'raw.githubusercontent.com') {
        const cached = await cache.match(
          new Request(request.url, { mode: 'no-cors' })
        );
        if (cached) return cached;

        try {
          const networkReq = new Request(request.url, { mode: 'no-cors' });
          const response = await fetch(networkReq);
          if (response) {
            await cache.put(networkReq, response.clone());
          }
          return response;
        } catch (err) {
          return cached || Response.error();
        }
      }

      // Same-origin (your Next app) – normal cache-first
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        return cached || Response.error();
      }
    })()
  );
});


// Receive list of URLs to prefetch from page
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'PREFETCH_URLS') return;

  const urls = data.urls || [];
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urls.map(async (u) => {
          try {
            const request = new Request(u, { mode: 'no-cors' });
            const res = await fetch(request);
            // opaque is fine, just store it; we don't inspect it
            await cache.put(request, res.clone());
          } catch (e) {
            console.error('Prefetch failed for', u, e);
          }
        })
      );
    })()
  );
});

