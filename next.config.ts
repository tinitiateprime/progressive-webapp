import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,

  runtimeCaching: [
    {
      urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*$/,
      handler: "CacheFirst",
      options: {
        cacheName: "github-raw-cache",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
})(nextConfig);
