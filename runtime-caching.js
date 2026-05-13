const defaultRuntimeCaching = require("next-pwa/cache");

const ONE_DAY = 24 * 60 * 60;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 365 * ONE_DAY;

const contentRuntimeCaching = [
  {
    urlPattern: ({ sameOrigin, url }) =>
      sameOrigin && (url.pathname.startsWith("/api/content/") || url.pathname.startsWith("/api/proxy")),
    handler: "NetworkFirst",
    options: {
      cacheName: "repo-content",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 3000,
        maxAgeSeconds: ONE_MONTH,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  {
    urlPattern: /\/_next\/data\/.+\/.+\.json(?:\?.*)?$/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "next-data",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 1500,
        maxAgeSeconds: ONE_MONTH,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  {
    urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)(?:\?.*)?$/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-image-assets",
      expiration: {
        maxEntries: 1500,
        maxAgeSeconds: ONE_YEAR,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:mp3|wav|ogg|m4a|aac|flac|opus)(?:\?.*)?$/i,
    handler: "CacheFirst",
    options: {
      rangeRequests: true,
      cacheName: "static-audio-assets",
      expiration: {
        maxEntries: 300,
        maxAgeSeconds: ONE_YEAR,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:mp4|m4v|mov|webm|ogv)(?:\?.*)?$/i,
    handler: "CacheFirst",
    options: {
      rangeRequests: true,
      cacheName: "static-video-assets",
      expiration: {
        maxEntries: 300,
        maxAgeSeconds: ONE_YEAR,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ request, sameOrigin, url }) =>
      sameOrigin && request.mode === "navigate" && !url.pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "app-pages",
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 1000,
        maxAgeSeconds: ONE_MONTH,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
];

module.exports = [...contentRuntimeCaching, ...defaultRuntimeCaching];
