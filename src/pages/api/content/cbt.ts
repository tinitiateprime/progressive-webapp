import type { NextApiRequest, NextApiResponse } from "next";
import { getCbtCollections } from "../../../lib/server-content";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const collections = await getCbtCollections();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load CBT collections",
    });
  }
}
