import { useEffect, useState } from "react";
import { fetchMarkdown } from "../services/githubContent";

export function useMarkdown(mdUrl) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(Boolean(mdUrl));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mdUrl) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const text = await fetchMarkdown(mdUrl);
        if (!alive) return;
        setContent(text);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load markdown");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [mdUrl]);

  return { content, loading, error };
}
