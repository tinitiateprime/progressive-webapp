import type { NextApiRequest, NextApiResponse } from "next";
import { readContentRepoStatus } from "../../../lib/server-content-source";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const status = await readContentRepoStatus();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load content repo status",
    });
  }
}
