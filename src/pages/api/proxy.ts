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

    res.setHeader("Cache-Control", "no-store");

    try {
      const response = await fetch(u.toString(), {
        cache: "no-store",
        headers: { "User-Agent": "NextProxy" },
      });

      const text = await response.text();
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      res.status(response.status).send(text);
      return;
    } catch {
      res.status(502).send("Failed to fetch requested URL from GitHub");
      return;
    }
  } catch {
    res.status(400).send("Invalid url");
  }
}
