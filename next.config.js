const path = require("path");
const runtimeCaching = require("./runtime-caching");

const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === "true";
const shouldDisablePwa = process.env.NODE_ENV !== "production" && !enablePwaInDev;

const withPWA = require("next-pwa")({
  dest: "public",
  register: false,
  skipWaiting: true,
  disable: shouldDisablePwa,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  runtimeCaching,
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = withPWA(nextConfig);
