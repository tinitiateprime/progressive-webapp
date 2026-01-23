"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

type CatalogTopic = {
  topic_name: string;
  md_url: string;
};

type CatalogSubject = {
  subject: string;
  topics: CatalogTopic[];
};

export default function TopicPage() {
  const router = useRouter();
  const { topic, subject } = router.query;

  const [catalogData, setCatalogData] = useState<CatalogSubject | null>(null);
  const [content, setContent] = useState("");
  const [currentMdUrl, setCurrentMdUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  /* ONLINE / OFFLINE DETECT */
  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  /* FETCH CATALOG + MARKDOWN */
  useEffect(() => {
    if (!topic || !subject) return;

    const catalogUrl =
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

    fetch(catalogUrl)
      .then((res) => res.json())
      .then((data: { qna_catalog: CatalogSubject[] }) => {
        const catalog = data.qna_catalog.find(
          (s) => s.subject.toLowerCase() === String(subject).toLowerCase()
        );
        if (!catalog) throw new Error("Subject not found");

        setCatalogData(catalog);  // Store full subject catalog

        const found = catalog.topics.find(
          (t) => t.topic_name === topic
        );
        if (!found) throw new Error("Topic not found");

        setCurrentMdUrl(found.md_url);
        return fetch(found.md_url);
      })
      .then((res) => res.text())
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch(() => {
        setError(
          navigator.onLine
            ? "Failed to load content"
            : "Offline – cached data not found"
        );
        setLoading(false);
      });
  }, [topic, subject]);

  /* SAVE WHOLE SUBJECT FOR OFFLINE */
  const saveSubjectForOffline = async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker not supported");
      return;
    }

    if (!catalogData) {
      alert("Catalog data not loaded yet");
      return;
    }

    const urls: string[] = [
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json",
    ];

    // Add ALL topics for this subject (not just current)
    catalogData.topics.forEach((t) => urls.push(t.md_url));

    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: "PREFETCH_URLS",
        urls,
      });
      alert(`Saved entire "${catalogData.subject}" subject for Offline ✅ (${catalogData.topics.length} topics)`);
    } catch (err) {
      alert("Failed to save for offline. Ensure Service Worker is registered.");
    }
  };

  if (loading)
    return <p style={{ padding: 30, textAlign: "center" }}>Loading…</p>;

  if (error)
    return (
      <p style={{ padding: 30, textAlign: "center", color: "red" }}>{error}</p>
    );

  if (!catalogData)
    return <p style={{ padding: 30, textAlign: "center" }}>No catalog data</p>;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9f9f9" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 280,
          padding: 20,
          background: "#fff",
          borderRight: "1px solid #eee",
        }}
      >
        <h3>{String(subject).toUpperCase()}</h3>

        <button
          onClick={saveSubjectForOffline}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: 16,
            border: "none",
            borderRadius: 6,
            background: isOffline ? "#ff4d4f" : "#0070f3",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isOffline ? "Offline Mode" : "Save Subject for Offline"}
        </button>

        {catalogData.topics.map((t) => (
          <Link
            key={t.topic_name}
            href={`/topic/${encodeURIComponent(
              t.topic_name
            )}?subject=${subject}`}
            style={{
              display: "block",
              padding: "10px",
              marginBottom: 6,
              borderRadius: 6,
              textDecoration: "none",
              background:
                topic === t.topic_name ? "#0070f3" : "#f1f1f1",
              color: topic === t.topic_name ? "#fff" : "#333",
            }}
          >
            {t.topic_name}
          </Link>
        ))}
      </aside>

      {/* CONTENT */}
      <main style={{ flex: 1, padding: 30, overflowY: "auto" }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src }) => {
              if (!src || typeof src !== "string") return null;
              let finalSrc = src;
              if (!src.startsWith("http")) {
                const base = currentMdUrl.substring(
                  0,
                  currentMdUrl.lastIndexOf("/") + 1
                );
                finalSrc =
                  base
                    .replace("github.com", "raw.githubusercontent.com")
                    .replace("/blob/", "/") + src;
              }
              return (
                <img
                  src={finalSrc}
                  style={{ maxWidth: "90%", display: "block", margin: "16px auto" }}
                />
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </main>
    </div>
  );
}
