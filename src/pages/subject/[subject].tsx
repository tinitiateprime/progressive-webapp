"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

type Topic = {
  topic_name: string;
  md_url: string;
};

export default function SubjectPage() {
  const router = useRouter();
  const { subject } = router.query;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  debugger
  // ONLINE / OFFLINE DETECT
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

  // FETCH SUBJECT TOPICS
  useEffect(() => {
    if (!router.isReady) return;
    if (!subject) return;

    const url =
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const found = data.qna_catalog.find(
          (s: any) =>
            s.subject.toLowerCase() === String(subject).toLowerCase()
        );
        if (!found) throw new Error("Subject not found");
        setTopics(found.topics);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subject");
        setLoading(false);
      });
  }, [router.isReady, subject]);

  // SAVE WHOLE SUBJECT (ALL md_url) FOR OFFLINE
  const saveSubjectForOffline = async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker not supported");
      return;
    }

    if (!topics.length) {
      alert("No topics loaded yet");
      return;
    }

    const urls: string[] = [
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json",
    ];

    // Add ALL Markdown URLs for this subject
    topics.forEach((t) => urls.push(t.md_url));

    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: "PREFETCH_URLS",
        urls,
      });
      alert(
        `Saved entire "${String(subject)}" subject for Offline ✅ (${topics.length} topics)`
      );
    } catch (err) {
      alert("Failed to save for offline. Ensure Service Worker is registered.");
    }
  };

  if (loading)
    return (
      <p style={{ padding: 30, textAlign: "center" }}>
        Loading…
      </p>
    );

  if (error)
    return (
      <p style={{ padding: 30, color: "red", textAlign: "center" }}>
        {error}
      </p>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#b0d0f6",
        display: "flex",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL – HEADER + OFFLINE INFO */}
        <aside
          style={{
            width: 320,
            borderRight: "1px solid #f0f0f0",
            padding: "24px 20px",
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1.2,
                color: "#888",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Subject
            </p>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                wordBreak: "break-word",
              }}
            >
              {String(subject).toUpperCase()}
            </h1>
          </div>

          <button
            onClick={saveSubjectForOffline}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isOffline ? "#ff4d4f" : "#0070f3",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 10px rgba(0, 112, 243, 0.35)",
            }}
          >
            {isOffline ? "Offline Mode" : "Save Subject for Offline"}
          </button>

          <p
            style={{
              fontSize: 12,
              color: "#666",
              lineHeight: 1.5,
              marginTop: 4,
            }}
          >
            This will download all Q&A content for this subject so it can be
            viewed later even without an internet connection.
          </p>

          <div
            style={{
              marginTop: "auto",
              padding: 12,
              borderRadius: 8,
              background: isOffline ? "#fff1f0" : "#f0f5ff",
              border: `1px solid ${isOffline ? "#ffa39e" : "#adc6ff"}`,
              fontSize: 12,
              color: "#555",
            }}
          >
            <strong>Status:</strong>{" "}
            {isOffline ? "You are offline. Cached content will be used." : "You are online. You can save this subject for offline use."}
          </div>
        </aside>

        {/* RIGHT PANEL – TOPIC LIST */}
        <main
          style={{
            flex: 1,
            padding: "24px 28px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                margin: 0,
                fontWeight: 600,
              }}
            >
              Topics ({topics.length})
            </h2>
            <span
              style={{
                fontSize: 12,
                color: "#999",
              }}
            >
              Tap a topic to open its Q&A
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {topics.map((t, idx) => (
              <Link
                key={t.topic_name}
                href={`/topic/${encodeURIComponent(
                  t.topic_name
                )}?subject=${subject}`}
                style={{
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #f0f0f0",
                    padding: "12px 14px",
                    background: "#fff",
                    cursor: "pointer",
                    transition:
                      "transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-1px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.06)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "#d6e4ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "#f0f0f0";
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#999",
                      marginBottom: 4,
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#222",
                      wordBreak: "break-word",
                    }}
                  >
                    {t.topic_name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
