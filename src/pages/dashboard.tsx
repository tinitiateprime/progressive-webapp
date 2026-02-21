"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ThemeContext } from "../context/ThemeContext";
import { FaMoon, FaSun, FaDownload, FaWifi } from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogTopic = { topic_name: string; md_url: string };
type CatalogSubject = { subject: string; topics: CatalogTopic[] };

type OfflineSubjectMeta = {
  subject: string;
  savedAt: number;
  topicCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OFFLINE_PREFIX = "offline_subject_";

const readOfflineSubjects = (): OfflineSubjectMeta[] => {
  const metas: OfflineSubjectMeta[] = [];
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(OFFLINE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "");
      if (typeof parsed?.subject === "string" && typeof parsed?.savedAt === "number") {
        metas.push({
          subject: parsed.subject,
          savedAt: parsed.savedAt,
          topicCount: parsed.topicCount ?? parsed.topics?.length ?? 0,
        });
      }
    } catch {}
  }
  // sort alphabetically
  return metas.sort((a, b) => a.subject.localeCompare(b.subject));
};


const toRawGithub = (u: string) => {
  const m = u.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
  if (!m) return u;
  const [, owner, repo, branch, path] = m;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};

/** Extract first URL from a string; also convert blob->raw if needed */
const extractUrl = (text: string) => {
  const m = text.match(/\bhttps?:\/\/[^\s)]+/);
  if (!m) return "";
  let url = m[0].replace(/[)\],]+$/g, "");
  if (url.includes("github.com/") && url.includes("/blob/")) url = toRawGithub(url);
  return url;
};

const cleanTitle = (s: string) =>
  s
    .replace(/\s*\*\s*https?:\/\/.*$/i, "")
    .replace(/\s*https?:\/\/.*$/i, "")
    .trim();

/**
 * ✅ Parses YOUR README format:
 *
 * Subject:
 *   ## Vue JS
 *
 * Topics:
 *   ### Introduction
 *   https://raw....
 */
const parseCatalogFromReadme = (md: string): CatalogSubject[] => {
  const text = (md || "").replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const map = new Map<string, CatalogSubject>();
  const ensureSubject = (name: string) => {
    const key = cleanTitle(name);
    if (!map.has(key)) map.set(key, { subject: key, topics: [] });
    return map.get(key)!;
  };

  let currentSubject: CatalogSubject | null = null;

  const addTopic = (sub: CatalogSubject, topic_name: string, md_url: string) => {
    const tn = cleanTitle(topic_name);
    const url = md_url.trim();
    if (!tn || !url) return;
    if (sub.topics.some((t) => t.topic_name === tn)) return;
    sub.topics.push({ topic_name: tn, md_url: url });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // SUBJECT: "## Vue JS" but ignore "## Catalog 1"
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      const heading = h2[1].trim();
      if (/^catalog\s*\d*/i.test(heading)) continue; // ignore "Catalog 1/2/3"
      currentSubject = ensureSubject(heading);
      continue;
    }

    // TOPIC: "### Introduction" and URL usually next line
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      if (!currentSubject) continue;

      const topicTitle = h3[1].trim();

      // URL can be on same line OR next lines until next heading
      let url = extractUrl(line);

      if (!url) {
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j];

          // stop if next heading starts
          if (/^#{1,6}\s+/.test(next)) break;

          const candidate = extractUrl(next);
          if (candidate) {
            url = candidate;
            break;
          }
        }
      }

      if (url) addTopic(currentSubject, topicTitle, url);
      continue;
    }
  }

  return Array.from(map.values()).filter((s) => s.subject && (s.topics?.length ?? 0) > 0);
};


// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSubjects, setOfflineSubjects] = useState<OfflineSubjectMeta[]>([]);
 
  // ── online/offline watcher ─────────────────────────────────────────────────
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

  // ── load offline subjects from localStorage ────────────────────────────────
  useEffect(() => {
    setOfflineSubjects(readOfflineSubjects());

    // re-read when storage changes (e.g. another tab saves offline)
    const onStorage = () => setOfflineSubjects(readOfflineSubjects());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  
  // ── load catalog from network ──────────────────────────────────────────────
  useEffect(() => {
    const readmeBlob =
      "https://github.com/tinitiateprime/tinitiate_it_traning_app/blob/main/README.md";
    const readmeRaw = toRawGithub(readmeBlob);
    fetch(readmeRaw)
      .then((r) => r.text())
      .then((text) => {
        const catalog = parseCatalogFromReadme(text);
        setSubjects(catalog);
        setLoading(false);
      })
      .catch(() => {
        setErr("Failed to load catalog");
        setLoading(false);
      });
  }, []);

  // ✅ Set mounted after first client render
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // ── UI helpers ─────────────────────────────────────────────────────────────

  const isSubjectOffline = (subjectName: string) =>
    offlineSubjects.some(
      (o) => o.subject.toLowerCase() === subjectName.toLowerCase()
    );
const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
    if (!mounted) {
    return (
      <div style={{ minHeight: "100vh" }}>
        {/* Topbar without any browser-dependent values */}
        <div className="card" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/favicon_new.png" alt="Tinitiate" style={{ width: 34, height: 34, borderRadius: 10 }} />
              <div>
                <div style={{ fontWeight: 800 }}>Tutorial Dashboard</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Pick a subject like a docs site</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>
          <div className="card" style={{ padding: 18 }}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* ── Topbar ── */}
      <div
        className="card"
        style={{
          borderRadius: 0,
          borderLeft: 0,
          borderRight: 0,
          borderTop: 0,
        }}
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
            <span className="badge">
              {isOffline ? "🔴 Offline" : "🟢 Online"}
            </span>
            <button
              className="btn btn-outline"
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
            >
              <span style={{ fontSize: 14 }}>
                {theme === "dark" ? <FaSun /> : <FaMoon />}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>

        {/* ── Offline subjects panel ── */}
        {offlineSubjects.length > 0 && (
          <div
            className="card"
            style={{
              padding: 16,
              marginBottom: 20,
              borderColor: isOffline
                ? "rgba(234,179,8,0.5)"
                : "rgba(22,163,74,0.3)",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <FaDownload
                style={{
                  color: isOffline ? "var(--brand-2)" : "var(--brand)",
                  fontSize: 14,
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Saved Offline
              </span>
              <span
                className="badge"
                style={{ marginLeft: 4, fontSize: 11 }}
              >
                {offlineSubjects.length}
              </span>
              {isOffline && (
                <span
                  className="badge"
                  style={{
                    marginLeft: "auto",
                    borderColor: "rgba(234,179,8,0.5)",
                    color: "#b45309",
                    fontSize: 11,
                  }}
                >
                  <FaWifi style={{ display: "inline", marginRight: 4 }} />
                  Offline mode
                </span>
              )}
            </div>

            {/* Offline subject cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {offlineSubjects.map((s) => (
                <button
                  key={s.subject}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/subject/${encodeURIComponent(s.subject)}`
                    )
                  }
                  style={{
                    textAlign: "left",
                    background: "var(--bg-2, rgba(0,0,0,0.04))",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.opacity = "0.75")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
                  }
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      textTransform: "capitalize",
                    }}
                  >
                    {s.subject}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {s.topicCount} topics
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    Saved {formatDate(s.savedAt)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Offline: no internet, no saved subjects ── */}
        {isOffline && offlineSubjects.length === 0 && (
          <div className="card" style={{ padding: 18, marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              You're offline
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              No subjects saved yet. Go online, open a subject and click
              "Save Offline".
            </div>
          </div>
        )}

        {/* ── All subjects (online catalog) ── */}
        {loading && (
          <div className="card" style={{ padding: 18 }}>
            Loading…
          </div>
        )}

        {!isOffline && !loading && err && (
          <div className="card" style={{ padding: 18, color: "crimson" }}>
            {err}
          </div>
        )}
        {!isOffline && loading && (
          <div className="card" style={{ padding: 18 }}>
            Loading…
          </div>
        )}
       
{!isOffline && !loading && !err && (
  <>
    {offlineSubjects.length > 0 && (
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--muted)",
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        All Subjects
      </div>
    )}

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 14,
      }}
    >
      {subjects.map((s) => {
        const savedOffline = isSubjectOffline(s.subject);
        return (
          <Link
            key={s.subject}
            href={`/subject/${encodeURIComponent(s.subject)}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card" style={{ padding: 16, position: "relative" }}>
              {savedOffline && (
                <span
                  className="badge"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    fontSize: 10,
                    borderColor: "rgba(22,163,74,0.4)",
                    color: "var(--brand)",
                  }}
                >
                  ✓ Offline
                </span>
              )}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  textTransform: "capitalize",
                  paddingRight: savedOffline ? 60 : 0,
                }}
              >
                {s.subject}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
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
                <span style={{ fontWeight: 800, color: "var(--brand-2)" }}>
                  Open →
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </>
)}
      </div>
    </div>
  );
}
