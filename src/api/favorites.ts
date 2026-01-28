// pages/api/favorites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type FavTopic = {
  slug: string;
  topic_name: string;
  subject: string;
};

const favFile = path.join(process.cwd(), "public", "data", "favorites.json");

function ensureFile() {
  const dir = path.dirname(favFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(favFile)) fs.writeFileSync(favFile, "[]", "utf-8");
}

function readFavorites(): FavTopic[] {
  try {
    ensureFile();
    const data = fs.readFileSync(favFile, "utf-8").trim();
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: FavTopic[]) {
  ensureFile();
  fs.writeFileSync(favFile, JSON.stringify(favorites, null, 2), "utf-8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  // ✅ GET
  if (req.method === "GET") {
    return res.status(200).json(readFavorites());
  }

  // ✅ POST (Add favorite)
  if (req.method === "POST") {
    const topic = req.body as FavTopic;

    if (!topic?.slug || !topic?.subject) {
      return res.status(400).json({ error: "Missing slug or subject" });
    }

    const favorites = readFavorites();

    const exists = favorites.some(
      (f) => f.slug === topic.slug && f.subject === topic.subject
    );

    if (!exists) {
      favorites.push(topic);
      writeFavorites(favorites);
    }

    return res.status(200).json(favorites);
  }

  // ✅ DELETE (Remove favorite)
  if (req.method === "DELETE") {
    const slug = String(req.query.slug || "");
    const subject = String(req.query.subject || "");

    if (!slug || !subject) {
      return res.status(400).json({ error: "Missing slug or subject" });
    }

    const updated = readFavorites().filter(
      (f) => !(f.slug === slug && f.subject === subject)
    );

    writeFavorites(updated);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
