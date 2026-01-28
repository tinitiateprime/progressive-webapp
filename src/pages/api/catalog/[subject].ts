import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { subject } = req.query;
  if (!subject || Array.isArray(subject)) return res.status(400).json({ error: "Invalid subject" });

  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json"
    );
    if (!response.ok) throw new Error("GitHub fetch failed");
    const data = await response.json();

    const catalog = data.qna_catalog.find(
      (item: any) => item.subject.toLowerCase() === subject.toLowerCase()
    );

    if (!catalog) return res.status(404).json({ error: "Subject not found" });

    res.status(200).json(catalog.topics);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
