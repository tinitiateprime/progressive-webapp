"use client";

import { useEffect, useState } from "react";

interface FavButtonProps {
  item: string;
}

export default function FavButton({ item }: FavButtonProps) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(item);
    setFav(stored === "true");
  }, [item]);

  const toggleFav = () => {
    const next = !fav;
    setFav(next);
    localStorage.setItem(item, next.toString());
  };

  return (
    <button
      onClick={toggleFav}
      className="btn-outline"
      aria-label={fav ? "Unfavorite" : "Favorite"}
      title={fav ? "Favorited" : "Favorite"}
    >
      <span className="text-base">{fav ? "★" : "☆"}</span>
      <span className="hidden sm:inline">{fav ? "Favorited" : "Favorite"}</span>
    </button>
  );
}
