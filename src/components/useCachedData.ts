"use client";
import { useEffect, useState } from "react";

const DATA_URL = "../public/data.json"; // local OR GitHub raw URL

export function useCachedData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem("tutorial-data");

    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    }

    fetch(DATA_URL)
      .then((res) => res.json())
      .then((json) => {
        localStorage.setItem("tutorial-data", JSON.stringify(json));
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false); // offline case
      });
  }, []);

  return { data, loading };
}
