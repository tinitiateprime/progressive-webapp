import type { NextApiRequest, NextApiResponse } from "next";
import { getSlideshowBySlug } from "../../../../lib/server-content";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = String(req.query.slug || "");

  try {
    const deck = await getSlideshowBySlug(slug);

    if (!deck) {
      res.status(404).json({ error: "Slideshow not found" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(deck);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load slideshow",
    });
  }
}
