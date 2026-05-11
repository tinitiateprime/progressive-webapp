"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaArrowLeft, FaMoon, FaSun } from "react-icons/fa";
import { ThemeContext } from "../../../context/ThemeContext";
import { fetchMediaItem } from "../../../lib/content-client";
import type { MediaCollectionItem } from "../../../lib/content-types";

const isMediaKind = (value: string): value is "training-videos" | "audio-books" =>
  value === "training-videos" || value === "audio-books";

export default function MediaDetailPage() {
  const router = useRouter();
  const { slug, kind } = router.query;
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [item, setItem] = useState<MediaCollectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated" || typeof slug !== "string" || typeof kind !== "string") {
      return;
    }

    if (!isMediaKind(kind)) {
      setError("Unsupported media type.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        setItem(await fetchMediaItem(kind, slug, controller.signal));
      } catch {
        setError("Failed to load media item.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [kind, slug, status]);

  const pageLabel = kind === "audio-books" ? "Audio Book" : "Training Video";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          theme === "dark"
            ? "linear-gradient(180deg, #020617, #0f172a)"
            : "linear-gradient(180deg, #f8fafc, #ffffff)",
      }}
    >
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 16px 32px" }}>
        <div className="card" style={{ padding: 18, borderRadius: 22 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>{pageLabel.toUpperCase()}</div>
              <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>
                {item?.title || "Loading media..."}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/cbt" className="btn btn-outline">
                <FaArrowLeft /> CBT Hub
              </Link>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18 }}>
            Loading media item...
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18, color: "crimson" }}>
            {error}
          </div>
        )}

        {!loading && item && (
          <>
            <section style={{ marginTop: 18 }}>
              <div className="card" style={{ padding: 18, borderRadius: 22 }}>
                <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                  {item.summary}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
                  Speaker: {item.speaker}
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge" style={{ fontSize: 10 }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <a
                    href={item.playlistUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Open Source Link
                  </a>
                </div>
              </div>
            </section>

            {item.embedUrl && (
              <section style={{ marginTop: 18 }}>
                <div className="card" style={{ padding: 18, borderRadius: 22 }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "56.25%",
                      borderRadius: 18,
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      src={item.embedUrl}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        border: 0,
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {item.notesMarkdown && (
              <section style={{ marginTop: 18 }}>
                <div className="card" style={{ padding: 22, borderRadius: 22 }}>
                  <div className="prose">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.notesMarkdown}</ReactMarkdown>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
