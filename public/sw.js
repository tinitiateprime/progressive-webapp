const CACHE_NAME = "tinitiate-offline-v1";
const SHELL_CACHE = "tinitiate-shell-v1";

const SHELL_URLS = ["/", "/dashboard"];

// ── Install: pre-cache shell pages ───────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(async (cache) => {
        await Promise.allSettled(
          SHELL_URLS.map((url) =>
            fetch(url)
              .then((res) => {
                if (!res.ok) throw new Error(`${res.status}`);
                return cache.put(url, res);
              })
              .catch((err) =>
                console.warn("[SW] Skipped pre-cache:", url, err.message)
              )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== SHELL_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and non-http requests
  if (req.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ── 1. Markdown files → Cache first ────────────────────────────────────────
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
          return new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // ── 2. Next.js static chunks → Cache first (content-hashed, safe forever) ──
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

  // ── 3. HTML page navigations → Network first, cache on success ─────────────
  const isNavigation =
    req.mode === "navigate" ||
    (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          // Online: fetch fresh, cache for later offline use
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          // Offline: serve exact cached page if visited before
          const cached = await cache.match(req);
          if (cached) return cached;

          // Fallback: serve /dashboard shell so Next.js routing can take over
          const fallback =
            (await cache.match("/dashboard")) ||
            (await cache.match("/"));

          if (fallback) return fallback;

          // Last resort: inline offline page
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width,initial-scale=1"/>
                <title>Offline</title>
                <style>
                  body { font-family: sans-serif; display: flex; flex-direction: column;
                         align-items: center; justify-content: center; min-height: 100vh;
                         margin: 0; gap: 12px; text-align: center; padding: 24px;
                         background: #0f172a; color: #f1f5f9; }
                  button { padding: 10px 24px; border-radius: 10px; border: none;
                           background: #06b6d4; color: #fff; font-size: 15px;
                           font-weight: 700; cursor: pointer; margin-top: 8px; }
                </style>
              </head>
              <body>
                <div style="font-size:52px">📡</div>
                <h2 style="margin:0">You're offline</h2>
                <p style="color:#94a3b8;font-size:14px;max-width:280px">
                  This page wasn't saved. Go back and open a subject
                  you've already saved offline.
                </p>
                <button onclick="history.back()">← Go Back</button>
                <button onclick="location.href='/dashboard'" style="background:#334155">
                  Go to Dashboard
                </button>
              </body>
            </html>`,
            { status: 200, headers: { "Content-Type": "text/html" } }
          );
        }
      })()
    );
    return;
  }
});
