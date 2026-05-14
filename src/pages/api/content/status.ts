import type { NextApiRequest, NextApiResponse } from "next";
import { readContentRepoStatus } from "../../../lib/server-content-source";
import { withServerCache } from "../../../lib/server-cache";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const status = await withServerCache("repo-status", readContentRepoStatus, 2 * 60 * 1000);
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load content repo status",
    });
  }
}
