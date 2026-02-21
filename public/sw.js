const CACHE_NAME = "tinitiate-offline-v1";
const SHELL_CACHE = "tinitiate-shell-v1";

// App shell routes to cache on install
const SHELL_URLS = [
  "/",
  "/dashboard",
  "/offline",                  // optional offline fallback page
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
// ✅ Safe install - skips failed URLs instead of crashing
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const results = await Promise.allSettled(
        SHELL_URLS.map((url) =>
          fetch(url)
            .then((res) => {
              if (!res.ok) throw new Error(`${res.status} ${url}`);
              return cache.put(url, res);
            })
            .catch((err) => {
              console.warn("[SW] Skipped caching:", url, err.message);
            })
        )
      );
      return results;
    }).then(() => self.skipWaiting())
  );
});


// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: strategy per request type ─────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Markdown files → Cache first, fallback network
  const isMd =
    url.pathname.endsWith(".md") ||
    url.href ===
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/README.md";

  if (isMd) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // 2. Next.js static chunks → Cache first (they are content-hashed, safe to cache forever)
  const isNextStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image");

  if (isNextStatic) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // 3. HTML page navigations → Network first, fallback to cache, then /offline
  const isNavigation =
    req.mode === "navigate" ||
    (req.method === "GET" &&
      req.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          // Cache the fresh page for next time
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          // Try to serve from cache
          const cached = await caches.match(req);
          if (cached) return cached;
          // Last resort: offline fallback page
          const fallback = await caches.match("/offline");
          return (
            fallback ||
            new Response("<h1>You are offline</h1>", {
              headers: { "Content-Type": "text/html" },
            })
          );
        }
      })()
    );
    return;
  }
});
