import type { NextApiRequest, NextApiResponse } from "next";
import { getDesignSystem } from "../../../lib/server-content";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const design = await getDesignSystem();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(design);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load design config",
    });
  }
}
