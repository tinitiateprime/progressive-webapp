"use client";
import { useState, useEffect } from "react";

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
    setFav(!fav);
    localStorage.setItem(item, (!fav).toString());
  };

  return <button onClick={toggleFav}>{fav ? "★ Favorited" : "☆ Favorite"}</button>;
}
