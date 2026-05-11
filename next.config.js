const path = require("path");

// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
};

module.exports =
  process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig;
