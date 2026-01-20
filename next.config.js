const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
module.exports = withPWA({
  reactStrictMode: true,
  experimental: {
    // Remove the turbo option if not supported in your version
    // turbo: false
  },
  turbopack: {
    root: "/home/site/wwwroot",  // Set this to the correct working directory
  },
});
