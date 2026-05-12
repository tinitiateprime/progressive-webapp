const defaultRuntimeCaching = require("next-pwa/cache");

const contentRuntimeCaching = [
  {
    urlPattern: ({ sameOrigin, url }) =>
      sameOrigin && (url.pathname.startsWith("/api/content/") || url.pathname.startsWith("/api/proxy")),
    handler: "NetworkFirst",
    options: {
      cacheName: "repo-content",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 128,
        maxAgeSeconds: 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  {
    urlPattern: ({ sameOrigin, url }) =>
      sameOrigin &&
      [
        "/dashboard",
        "/courses",
        "/interview",
        "/cbt",
        "/offline",
      ].some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`)),
    handler: "NetworkFirst",
    options: {
      cacheName: "learning-pages",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 48,
        maxAgeSeconds: 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
];

module.exports = [...contentRuntimeCaching, ...defaultRuntimeCaching];
