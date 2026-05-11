import type { NextApiRequest, NextApiResponse } from "next";
import { getInterviewQuestionBySlug } from "../../../../lib/server-content";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = String(req.query.slug || "");

  try {
    const item = await getInterviewQuestionBySlug(slug);

    if (!item) {
      res.status(404).json({ error: "Interview question not found" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load interview question",
    });
  }
}
