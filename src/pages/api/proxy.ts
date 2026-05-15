import type { NextApiRequest, NextApiResponse } from "next";

import { withServerCache } from "../../lib/server-cache";
import {
  CONTENT_NO_STORE,
  withContentServerCache,
} from "../../lib/server-content-cache";
import {
  buildContentRepoRawUrl,
  parseContentRepoPathFromUrl,
} from "../../lib/content-repo-config";

const ALLOW_HOSTS = new Set([
  "raw.githubusercontent.com",
  "github.com",
  "api.github.com",
]);
const PROXY_CACHE_TTL_MS = 5 * 60 * 1000;

type ProxyPayload = {
  status: number;
  contentType: string | null;
  body: Buffer;
};

class ProxyHttpError extends Error {
  payload: ProxyPayload;

  constructor(payload: ProxyPayload) {
    super(`GitHub proxy request failed (${payload.status})`);
    this.payload = payload;
  }
}

const fetchGitHubPayload = async (url: string): Promise<ProxyPayload> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "NextProxy" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const payload = {
    status: response.status,
    contentType: response.headers.get("content-type"),
    body: Buffer.from(await response.arrayBuffer()),
  };

  if (!response.ok) {
    throw new ProxyHttpError(payload);
  }

  return payload;
};

const sendPayload = (res: NextApiResponse, payload: ProxyPayload, cacheControl: string) => {
  if (payload.contentType) {
    res.setHeader("Content-Type", payload.contentType);
  }
  res.setHeader("Cache-Control", cacheControl);
  res.status(payload.status).send(payload.body);
};

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

    try {
      const contentPath = parseContentRepoPathFromUrl(u.toString());
      const cacheKey = `proxy:${u.toString()}`;
      const loadPayload = (repoRef?: string) =>
        fetchGitHubPayload(
          contentPath !== null && repoRef
            ? buildContentRepoRawUrl(contentPath, undefined, repoRef)
            : u.toString()
        );
      const payload =
        contentPath !== null
          ? await withContentServerCache(cacheKey, loadPayload, PROXY_CACHE_TTL_MS)
          : await withServerCache(cacheKey, loadPayload, PROXY_CACHE_TTL_MS);

      sendPayload(res, payload, CONTENT_NO_STORE);
      return;
    } catch (error) {
      if (error instanceof ProxyHttpError) {
        sendPayload(res, error.payload, "no-store");
        return;
      }

      res.status(502).send("Failed to fetch requested URL from GitHub");
      return;
    }
  } catch {
    res.status(400).send("Invalid url");
  }
}
