const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const nextDevDir = path.join(rootDir, ".next", "dev");
const publicDir = path.join(rootDir, "public");
const swPath = path.join(publicDir, "sw.js");
const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === "true";

const placeholderScript = `const NOOP_PWA_PLACEHOLDER = "NOOP_PWA_PLACEHOLDER";
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
`;

fs.rmSync(nextDevDir, { recursive: true, force: true });

if (enablePwaInDev) {
  process.exit(0);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(swPath, placeholderScript, "utf8");

for (const entry of fs.readdirSync(publicDir)) {
  if (/^workbox-.*\.js$/i.test(entry)) {
    fs.rmSync(path.join(publicDir, entry), { force: true });
  }
}
