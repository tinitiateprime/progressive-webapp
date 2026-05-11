import type { NextApiRequest, NextApiResponse } from "next";
import { getCourseSubjects } from "../../../lib/server-content";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const subjects = await getCourseSubjects();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load courses",
    });
  }
}
