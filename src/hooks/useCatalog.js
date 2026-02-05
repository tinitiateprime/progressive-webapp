// src/hooks/useCatalog.js

import { useEffect, useMemo, useState } from "react";
import { fetchCatalog } from "../services/githubContent";

function extractCatalog(json) {
  // supports:
  // 1) { qna_catalogcard: [...] }
  // 2) { qna_catalog: [...] }
  // 3) [...]
  const maybe =
    json?.qna_catalogcard ??
    json?.qna_catalog ??
    json?.catalog ??
    json;

  return Array.isArray(maybe) ? maybe : [];
}

export function useCatalog() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const json = await fetchCatalog();
        if (!alive) return;
        setData(json);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load catalog");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const catalog = useMemo(() => extractCatalog(data), [data]);

  // ✅ now you can directly use `catalog`
  return { data, catalog, loading, error };
}
