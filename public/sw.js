const CACHE_NAME = 'tinitiate-offline-v1';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // limit this to your markdown + README
  const isMd =
    url.pathname.endsWith('.md') ||
    url.href === 'https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/README.md';

  if (!isMd) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        // optional: return a fallback Response here
        return new Response('Offline', { status: 503 });
      }
    })()
  );
});
