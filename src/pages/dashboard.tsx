"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ThemeContext } from "../context/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";

type CatalogTopic = { topic_name: string; md_url: string };
type CatalogSubject = { subject: string; topics: CatalogTopic[] };

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [isOffline, setIsOffline] = useState(false);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

  useEffect(() => {
    const url =
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

    const load = async () => {
      try {
        const res = await fetch(url);

        if (!res.ok) {
          // HTTP error (404, 500, etc.)
          const text = await res.text().catch(() => "");
          throw new Error(
            `HTTP ${res.status} ${res.statusText}${
              text ? ` – ${text.slice(0, 120)}...` : ""
            }`
          );
        }

        // Try to parse JSON and catch invalid JSON separately
        let json: any;
        try {
          json = await res.json();
        } catch (e: any) {
          throw new Error(`Invalid JSON: ${e?.message || "parse error"}`);
        }

        const catalog = Array.isArray(json.qna_catalog)
          ? json.qna_catalog
          : [];

        setSubjects(catalog);
        setErr("");
      } catch (e: any) {
        console.error("Catalog fetch failed:", e);
        setErr(e?.message || "Unknown error while loading catalog");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Topbar */}
      <div
        className="card"
        style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/favicon_new.png"
              alt="Tinitiate"
              style={{ width: 34, height: 34, borderRadius: 10 }}
            />
            <div>
              <div style={{ fontWeight: 800 }}>Tutorial Dashboard</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Pick a subject like a docs site
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge">{isOffline ? "Offline" : "Online"}</span>
            <button
              className="btn btn-outline"
              onClick={toggleTheme}
              type="button"
            >
              {theme === "dark" ? <FaSun /> : <FaMoon />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>
        {loading && (
          <div className="card" style={{ padding: 18 }}>
            Loading…
          </div>
        )}

        {!loading && err && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ color: "crimson", fontWeight: 700 }}>
              Failed to load catalog
            </div>
            <div style={{ marginTop: 6, fontSize: 13, whiteSpace: "pre-wrap" }}>
              {err}
            </div>
          </div>
        )}

        {!loading && !err && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {subjects.map((s) => (
              <Link
                key={s.subject}
                href={`/subject/${encodeURIComponent(s.subject)}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      textTransform: "capitalize",
                    }}
                  >
                    {s.subject}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: "var(--muted)",
                    }}
                  >
                    {s.topics?.length || 0} topics
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        borderColor: "rgba(22,163,74,0.35)",
                        color: "var(--brand)",
                      }}
                    >
                      Start
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        color: "var(--brand-2)",
                      }}
                    >
                      Open →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
