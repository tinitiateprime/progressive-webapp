import type { NextApiRequest, NextApiResponse } from "next";
import { getDesignSystem } from "../../../lib/server-content";
import { withServerCache } from "../../../lib/server-cache";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const design = await withServerCache("design", getDesignSystem, 5 * 60 * 1000);
    // Allow CDN / service worker to serve stale for 60s while revalidating
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.status(200).json(design);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load design config",
    });
  }
}
