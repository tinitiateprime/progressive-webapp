import type { NextApiRequest, NextApiResponse } from "next";

const ALLOW_HOSTS = new Set([
  "raw.githubusercontent.com",
  "github.com",
  "api.github.com",
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = String(req.query.url || "");

  try {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      return res.status(400).send("Only https URLs allowed");
    }
    if (!ALLOW_HOSTS.has(u.hostname)) {
      return res.status(400).send("Host not allowed");
    }

    const r = await fetch(u.toString(), {
      headers: { "User-Agent": "NextProxy" },
    });

    const text = await r.text();
    res.setHeader("Cache-Control", "no-store");
    res.status(r.status).send(text);
  } catch {
    res.status(400).send("Invalid url");
  }
}