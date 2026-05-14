import type { NextApiRequest, NextApiResponse } from "next";
import { getInterviewQuestionBySlug } from "../../../../lib/server-content";
import { withServerCache } from "../../../../lib/server-cache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = String(req.query.slug || "");

  try {
    const item = await withServerCache(
      `interview:${slug}`,
      () => getInterviewQuestionBySlug(slug),
      3 * 60 * 1000
    );

    if (!item) {
      res.status(404).json({ error: "Interview question not found" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load interview question",
    });
  }
}
