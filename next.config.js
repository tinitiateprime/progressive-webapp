// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = { reactStrictMode: true };

module.exports =
  process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig;