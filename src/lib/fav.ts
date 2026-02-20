// lib/fav.ts

export type FavTopic = {
  slug: string;
  topic_name: string;
  subject: string;
};

// In-memory store (resets when server restarts / redeploys)
let FAVS: FavTopic[] = [];

export function getFavs() {
  return FAVS;
}

export function addFav(fav: FavTopic) {
  const exists = FAVS.some((x) => x.slug === fav.slug);
  if (!exists) FAVS = [fav, ...FAVS];
  return FAVS;
}

export function removeFav(slug: string) {
  FAVS = FAVS.filter((x) => x.slug !== slug);
  return FAVS;
}

