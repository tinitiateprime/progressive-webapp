import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || Array.isArray(url)) return res.status(400).json({ error: "Invalid URL" });

  try {
    const ghUrl = (url as string)
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");

    const response = await fetch(ghUrl);
    if (!response.ok) throw new Error("Failed to fetch markdown");

    const md = await response.text();
    res.status(200).send(md);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
