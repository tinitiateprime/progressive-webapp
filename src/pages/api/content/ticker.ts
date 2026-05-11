import type { NextApiRequest, NextApiResponse } from "next";
import { getTickerItems } from "../../../lib/server-content";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await getTickerItems();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load ticker items",
    });
  }
}
