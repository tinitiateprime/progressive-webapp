"use client";

// File: src/pages/dashboard.tsx
// ✅ Added Logout button
// ✅ On logout: clears local auth + redirects to /login (fallback to / if not found)

import Link from "next/link";
import type { CSSProperties } from "react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ThemeContext } from "../context/ThemeContext";
import { FaMoon, FaSun, FaSearch, FaTimes, FaHome, FaSignOutAlt } from "react-icons/fa";

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
  return metas.sort((a, b) => a.subject.localeCompare(b.subject));
};

const toRawGithub = (u: string) => {
  const m = u.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
  if (!m) return u;
  const [, owner, repo, branch, path] = m;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};

const extractUrl = (text: string) => {
  const m = text.match(/\bhttps?:\/\/[^\s)]+/);
  if (!m) return "";
  let url = m[0].replace(/[)\],]+$/g, "");
  if (url.includes("github.com/") && url.includes("/blob/")) url = toRawGithub(url);
  return url;
};

const cleanTitle = (s: string) =>
  s.replace(/\s*\*\s*https?:\/\/.*$/i, "").replace(/\s*https?:\/\/.*$/i, "").trim();

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

    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      const heading = h2[1].trim();
      if (/^catalog\s*\d*/i.test(heading)) continue;
      currentSubject = ensureSubject(heading);
      continue;
    }

    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      if (!currentSubject) continue;

      const topicTitle = h3[1].trim();
      let url = extractUrl(line);

      if (!url) {
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j];
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

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const normalizeSearch = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// ✅ Try redirecting to login, then signup, then home
async function safeRedirectAfterLogout(router: ReturnType<typeof useRouter>) {
  const candidates = ["/login", "/signup", "/"];
  for (const path of candidates) {
    try {
      const res = await fetch(path, { method: "HEAD" });
      if (res.ok) {
        router.push(path);
        return;
      }
    } catch {
      // ignore
    }
  }
  router.push("/");
}

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
  const [q, setQ] = useState("");

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
    const onStorage = () => setOfflineSubjects(readOfflineSubjects());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── load catalog from network ──────────────────────────────────────────────
  useEffect(() => {
    const readmeBlob = "https://github.com/tinitiateprime/tinitiate_it_traning_app/blob/main/README.md";
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

  useEffect(() => setMounted(true), []);

  const isSubjectOffline = (subjectName: string) =>
    offlineSubjects.some((o) => o.subject.toLowerCase() === subjectName.toLowerCase());

  const lastOfflineSavedAt = useMemo(() => {
    if (!offlineSubjects.length) return null;
    return Math.max(...offlineSubjects.map((s) => s.savedAt));
  }, [offlineSubjects]);

  const filteredSubjects = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return subjects;

    return subjects.filter((s) => {
      const subjectHit = normalizeSearch(s.subject).includes(query);
      const topicHit = (s.topics || []).some((t) => normalizeSearch(t.topic_name).includes(query));
      return subjectHit || topicHit;
    });
  }, [subjects, q]);

  // ✅ Logout handler (supports both custom token + NextAuth if present)
  const handleLogout = async () => {
    // 1) If you use NextAuth in this project, this will work automatically.
    try {
      const mod = await import("next-auth/react");
      if (typeof mod?.signOut === "function") {
        await mod.signOut({ redirect: false });
      }
    } catch {
      // project may not have next-auth - ignore
    }

    // 2) Clear any common auth keys you might be storing (custom auth)
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("auth");
      sessionStorage.removeItem("user");
    } catch {
      // ignore
    }

    // 3) Clear cookies quickly (best effort)
    try {
      document.cookie
        .split(";")
        .map((c) => c.trim())
        .forEach((c) => {
          const eq = c.indexOf("=");
          const name = eq > -1 ? c.slice(0, eq) : c;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
    } catch {
      // ignore
    }

    // 4) Redirect
    await safeRedirectAfterLogout(router);
  };

  // ─── UI styles ─────────────────────────────────────────────────────────────

  const pageBg: CSSProperties = {
    minHeight: "100vh",
    background:
      theme === "dark"
        ? "radial-gradient(900px 500px at 20% -10%, rgba(56,189,248,0.20), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.18), transparent 55%), linear-gradient(180deg, rgba(2,6,23,1), rgba(2,6,23,1))"
        : "radial-gradient(900px 500px at 20% -10%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.14), transparent 55%), linear-gradient(180deg, #f8fafc, #ffffff)",
  };

  const shell: CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "16px 16px 22px" };

  const headerCard =
    theme === "dark"
      ? "rounded-2xl p-6 bg-gradient-to-r from-slate-900 to-slate-800 shadow-md border border-slate-800 text-slate-100"
      : "rounded-2xl p-6 bg-gradient-to-r from-cyan-100 to-blue-100 shadow-md text-slate-900";

  const searchCard =
    theme === "dark"
      ? "rounded-2xl p-3 bg-slate-900/70 border border-slate-800 shadow-sm"
      : "rounded-2xl p-3 bg-white/90 border border-slate-200 shadow-sm";

  const btnBase =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

  const btnOutline =
    theme === "dark"
      ? `${btnBase} border border-slate-700 bg-slate-900 hover:bg-slate-800`
      : `${btnBase} border border-slate-200 bg-white hover:bg-slate-50`;

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <div style={shell}>
          <div className={headerCard}>
            <div className="flex items-center gap-3">
              <img src="/favicon_new.png" alt="Tinitiate" className="w-10 h-10 rounded-xl" />
              <div>
                <div className="text-xl font-bold">DASHBOARD</div>
                <div className="text-sm opacity-80">Loading…</div>
              </div>
            </div>

            <div className="mt-4">
              <div className={searchCard}>
                <div className="flex items-center gap-3">
                  <FaSearch className={theme === "dark" ? "text-slate-300" : "text-slate-500"} />
                  <div className="text-sm opacity-70">Search subjects…</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl p-6 bg-white/70 border border-slate-200">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageBg}>
      <div style={shell}>
        {/* Header */}
        <div className={headerCard}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src="/favicon_new.png" alt="Tinitiate" className="w-10 h-10 rounded-xl" />
              <div className="min-w-0">
                <h3 className="text-2xl sm:text-2xl font-bold tracking-tight truncate">Tutorial Dashboard</h3>

                <div className={theme === "dark" ? "text-sm text-slate-300" : "text-sm text-slate-700"}>
                  {isOffline ? "🔴 Offline" : "🟢 Online"} • {subjects.length} subjects • {offlineSubjects.length} offline
                  saved
                </div>

                {lastOfflineSavedAt && (
                  <div className={theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-600"}>
                    Saved at: {formatDate(lastOfflineSavedAt)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className={btnOutline} onClick={() => router.push("/")} type="button" title="Home" aria-label="Home">
                <FaHome />
              </button>

              <button className={btnOutline} onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>

              {/* ✅ Logout */}
              <button className={btnOutline} onClick={handleLogout} type="button" title="Logout">
                <FaSignOutAlt />
                
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className={`flex items-center gap-3 ${searchCard}`}>
              <FaSearch className={theme === "dark" ? "text-slate-300" : "text-slate-500"} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topics..."
                className={`w-full bg-transparent outline-none text-sm ${
                  theme === "dark" ? "placeholder:text-slate-500" : "placeholder:text-slate-400"
                }`}
              />
              {q.trim() && (
                <button
                  type="button"
                  className={btnOutline + " !px-3 !py-2"}
                  onClick={() => setQ("")}
                  title="Clear"
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Offline subjects panel ── */}
        {offlineSubjects.length > 0 && (
          <div
            className="card"
            style={{
              padding: 16,
              marginTop: 18,
              marginBottom: 18,
              borderColor: isOffline ? "rgba(234,179,8,0.5)" : "rgba(22,163,74,0.35)",
              background:
                theme === "dark"
                  ? "linear-gradient(180deg, rgba(15,23,42,0.70), rgba(2,6,23,0.55))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.70))",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Saved Offline</span>
              <span className="badge" style={{ marginLeft: 4, fontSize: 11 }}>
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
                  Offline mode
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {offlineSubjects.map((s) => (
                <button
                  key={s.subject}
                  type="button"
                  onClick={() => router.push(`/subject/${encodeURIComponent(s.subject)}`)}
                  style={{
                    textAlign: "left",
                    background: theme === "dark" ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.70)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, opacity 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.92";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14, textTransform: "capitalize" }}>{s.subject}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>{s.topicCount} topics</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>Saved {formatDate(s.savedAt)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Offline: no internet, no saved subjects ── */}
        {isOffline && offlineSubjects.length === 0 && (
          <div
            className="card"
            style={{
              padding: 18,
              marginBottom: 18,
              textAlign: "center",
              marginTop: 18,
              background:
                theme === "dark"
                  ? "linear-gradient(180deg, rgba(15,23,42,0.70), rgba(2,6,23,0.55))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.70))",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>You're offline</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              No subjects saved yet. Go online, open a subject and click "Save Offline".
            </div>
          </div>
        )}

        {/* ── All subjects (online catalog) ── */}
        {loading && (
          <div className="card" style={{ padding: 18, marginTop: 18 }}>
            Loading…
          </div>
        )}

        {!isOffline && !loading && err && (
          <div className="card" style={{ padding: 18, color: "crimson", marginTop: 18 }}>
            {err}
          </div>
        )}

        {!isOffline && !loading && !err && (
          <>
            {q.trim() && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 10px" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Results
                </div>
                <div className="badge" style={{ fontSize: 11 }}>
                  {filteredSubjects.length} match{filteredSubjects.length === 1 ? "" : "es"}
                </div>
              </div>
            )}

            {filteredSubjects.length === 0 ? (
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>No results</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  Try a different keyword (subject name or topic name).
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {filteredSubjects.map((s) => {
                  const savedOffline = isSubjectOffline(s.subject);
                  const hint = q.trim()
                    ? `${(s.topics || [])
                        .filter((t) => normalizeSearch(t.topic_name).includes(normalizeSearch(q)))
                        .slice(0, 2)
                        .map((t) => t.topic_name)
                        .join(" • ")}`
                    : "";

                  return (
                    <Link key={s.subject} href={`/subject/${encodeURIComponent(s.subject)}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div
                        className="card"
                        style={{
                          padding: 16,
                          position: "relative",
                          background:
                            theme === "dark"
                              ? "linear-gradient(180deg, rgba(15,23,42,0.65), rgba(2,6,23,0.55))"
                              : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.70))",
                          backdropFilter: "blur(10px)",
                          borderRadius: 18,
                          transition: "transform 0.18s ease, box-shadow 0.18s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
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

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: theme === "dark" ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.8)",
                              fontWeight: 900,
                            }}
                          >
                            {(s.subject || "S").trim().charAt(0).toUpperCase()}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, textTransform: "capitalize", paddingRight: savedOffline ? 60 : 0, lineHeight: 1.2 }}>
                              {s.subject}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>{s.topics?.length || 0} topics</div>
                          </div>
                        </div>

                        {q.trim() && hint && (
                          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                            Matching topics: <span style={{ color: "inherit", fontWeight: 700 }}>{hint}</span>
                          </div>
                        )}

                        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="badge" style={{ borderColor: "rgba(56,189,248,0.35)", color: "var(--brand-2)" }}>
                            Explore
                          </span>
                          <span style={{ fontWeight: 900, color: "var(--brand-2)" }}>Open →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}