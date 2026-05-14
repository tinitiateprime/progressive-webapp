import type { NextApiRequest, NextApiResponse } from "next";
import { getCbtCollections } from "../../../lib/server-content";
import { withServerCache } from "../../../lib/server-cache";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const collections = await withServerCache("cbt", getCbtCollections, 3 * 60 * 1000);
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load CBT collections",
    });
  }
}
