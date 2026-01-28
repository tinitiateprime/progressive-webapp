import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { promises as fs } from "fs";

type FavTopic = { slug: string; topic_name: string; subject: string };

const favoritesPath = path.join(process.cwd(), "public", "data", "favorites.json");

async function readFavorites(): Promise<FavTopic[]> {
  try {
    const raw = await fs.readFile(favoritesPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

async function writeFavorites(favs: FavTopic[]) {
  await fs.mkdir(path.dirname(favoritesPath), { recursive: true });
  const tmp = favoritesPath + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(favs, null, 2), "utf8");
  await fs.rename(tmp, favoritesPath);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const favorites = await readFavorites();
      return res.status(200).json({ favorites });
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as Partial<FavTopic>;
      if (!body.slug || !body.topic_name || !body.subject) {
        return res.status(400).json({ error: "Missing slug/topic_name/subject" });
      }

      const favorites = await readFavorites();
      const exists = favorites.some((f) => f.slug === body.slug);
      const updated = exists ? favorites : [...favorites, body as FavTopic];
      await writeFavorites(updated);
      return res.status(200).json({ favorites: updated });
    }

    if (req.method === "DELETE") {
      const body = (req.body || {}) as Partial<FavTopic>;
      const slug = body.slug || String(req.query.slug || "");
      if (!slug) return res.status(400).json({ error: "Missing slug" });

      const favorites = await readFavorites();
      const updated = favorites.filter((f) => f.slug !== slug);
      await writeFavorites(updated);
      return res.status(200).json({ favorites: updated });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("Favorites API error:", err);
    return res.status(500).json({ error: "Failed to update favorites.json" });
  }
}
