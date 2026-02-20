// pages/api/favorites.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { addFav, getFavs, removeFav, type FavTopic } from "../../lib/fav";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET /api/favorites
  if (req.method === "GET") {
    return res.status(200).json(getFavs());
  }

  // POST /api/favorites  (body: {slug, topic_name, subject})
  if (req.method === "POST") {
    const body = req.body as Partial<FavTopic>;

    if (!body?.slug || !body?.topic_name || !body?.subject) {
      return res.status(400).json({ error: "slug, topic_name, subject required" });
    }

    const updated = addFav({
      slug: body.slug,
      topic_name: body.topic_name,
      subject: body.subject,
    });

    return res.status(200).json(updated);
  }

  // DELETE /api/favorites?slug=xxx
  if (req.method === "DELETE") {
    const slug = String(req.query.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug query param required" });

    const updated = removeFav(slug);
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}