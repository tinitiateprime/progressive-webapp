"use client";

// File: src/pages/dashboard.tsx

import Link from "next/link";
import type { CSSProperties } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { ThemeContext } from "../context/ThemeContext";
import {
  FaMoon,
  FaSun,
  FaSearch,
  FaTimes,
  FaSignOutAlt,
  FaTrash,
} from "react-icons/fa";

import {
  fetchTextStrict,
  normalize as normalizeKey,
  parseMainCatalogReadme,
  parseSubjectTopicsFromReadme,
  toRawGithub,
} from "../lib/readme-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogTopic = { topic_name: string; md_url: string };
type CatalogSubject = { subject: string; readme_url: string; topics: CatalogTopic[] };

type OfflineSubjectMeta = {
  subject: string;
  savedAt: number;
  topicCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OFFLINE_PREFIX = "offline_subject_";

const readOfflineSubjects = (): OfflineSubjectMeta[] => {
  const metas: OfflineSubjectMeta[] = [];

  if (typeof window === "undefined") return metas;

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
    } catch {
      // ignore bad localStorage entries
    }
  }

  return metas.sort((a, b) => a.subject.localeCompare(b.subject));
};

const removeOfflineSubjectFromStorage = (subjectName: string) => {
  if (typeof window === "undefined") return;

  const target = normalizeKey(subjectName);
  const keysToRemove: string[] = [];

  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(OFFLINE_PREFIX)) continue;

    let matchedByPayload = false;

    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "");
      if (typeof parsed?.subject === "string") {
        matchedByPayload = normalizeKey(parsed.subject) === target;
      }
    } catch {
      // ignore bad localStorage entries
    }

    const matchedByKey = key === `${OFFLINE_PREFIX}${target}`;

    if (matchedByPayload || matchedByKey) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

const normalizeSearch = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { data: session, status } = useSession();

  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSubjects, setOfflineSubjects] = useState<OfflineSubjectMeta[]>([]);
  const [q, setQ] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    const name = session?.user?.name?.trim();
    if (name) return name;

    const emailPrefix = session?.user?.email?.split("@")[0]?.trim();
    if (emailPrefix) return emailPrefix;

    return "User";
  }, [session]);

  const displayEmail = session?.user?.email?.trim() || "Signed in";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // Protect dashboard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // detect mobile screen
  useEffect(() => {
    if (!mounted) return;

    const update = () => {
      setIsMobileView(window.innerWidth < 640);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [mounted]);

  // close profile popup on outside click / escape
  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  // online/offline watcher
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

  // load offline subjects from localStorage
  useEffect(() => {
    if (!mounted) return;

    setOfflineSubjects(readOfflineSubjects());

    const onStorage = () => setOfflineSubjects(readOfflineSubjects());
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  // load main catalog only when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const readmeBlob =
          "https://github.com/tinitiateprime/tinitiate_it_traning_app/blob/main/README.md";
        const readmeRaw = toRawGithub(readmeBlob);

        const mainReadme = await fetchTextStrict(readmeRaw);
        const mainSubjects = parseMainCatalogReadme(mainReadme);

        const enriched = await Promise.all(
          mainSubjects.map(async (s) => {
            try {
              const subjectReadmeText = await fetchTextStrict(s.readme_url);
              const topics = parseSubjectTopicsFromReadme(subjectReadmeText, s.readme_url);
              return { subject: s.subject, readme_url: s.readme_url, topics };
            } catch {
              return {
                subject: s.subject,
                readme_url: s.readme_url,
                topics: [] as CatalogTopic[],
              };
            }
          })
        );

        if (cancelled) return;

        setSubjects(enriched);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setErr("Failed to load catalog");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSubjectOffline = (subjectName: string) =>
    offlineSubjects.some((o) => normalizeKey(o.subject) === normalizeKey(subjectName));

  const lastOfflineSavedAt = useMemo(() => {
    if (!offlineSubjects.length) return null;
    return Math.max(...offlineSubjects.map((s) => s.savedAt));
  }, [offlineSubjects]);

  const filteredSubjects = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return subjects;

    return subjects.filter((s) => {
      const subjectHit = normalizeSearch(s.subject).includes(query);
      const topicHit = (s.topics || []).some((t) =>
        normalizeSearch(t.topic_name).includes(query)
      );
      return subjectHit || topicHit;
    });
  }, [subjects, q]);

  const handleRemoveOfflineSubject = (subjectName: string) => {
    const ok = window.confirm(`Remove "${subjectName}" from offline saved items?`);
    if (!ok) return;

    removeOfflineSubjectFromStorage(subjectName);
    setOfflineSubjects(readOfflineSubjects());
  };

  const clearLocalAuthStorage = () => {
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
  };

  const handleLogout = async () => {
    setProfileOpen(false);

    try {
      await signOut({ redirect: false });
    } catch {
      // ignore
    }

    clearLocalAuthStorage();
    router.replace("/login");
  };

  const handleUseAnotherAccount = () => {
    setProfileOpen(false);
    router.push("/login");
  };

  // ─── UI styles ─────────────────────────────────────────────────────────────

  const pageBg: CSSProperties = {
    minHeight: "100vh",
    background:
      theme === "dark"
        ? "radial-gradient(900px 500px at 20% -10%, rgba(56,189,248,0.20), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.18), transparent 55%), linear-gradient(180deg, rgba(2,6,23,1), rgba(2,6,23,1))"
        : "radial-gradient(900px 500px at 20% -10%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.14), transparent 55%), linear-gradient(180deg, #f8fafc, #ffffff)",
  };

  const shell: CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 16px 22px",
  };

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

  const profileButtonStyle: CSSProperties = {
    borderRadius: 14,
    border: theme === "dark" ? "1px solid rgb(51 65 85)" : "1px solid rgb(226 232 240)",
    background: theme === "dark" ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)",
    padding: isMobileView ? "8px" : "8px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: isMobileView ? 0 : 10,
    cursor: "pointer",
    minWidth: 0,
  };

  const profileMenuStyle: CSSProperties = isMobileView
    ? {
        position: "fixed",
        top: 88,
        left: 12,
        right: 12,
        width: "auto",
        maxWidth: "none",
        borderRadius: 18,
        overflow: "hidden",
        zIndex: 80,
        border:
          theme === "dark"
            ? "1px solid rgba(51,65,85,0.9)"
            : "1px solid rgba(226,232,240,1)",
        background: theme === "dark" ? "rgba(15,23,42,0.98)" : "rgba(255,255,255,0.98)",
        boxShadow:
          theme === "dark"
            ? "0 20px 50px rgba(0,0,0,0.45)"
            : "0 20px 50px rgba(15,23,42,0.16)",
        backdropFilter: "blur(12px)",
        maxHeight: "calc(100vh - 108px)",
        overflowY: "auto",
      }
    : {
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 320,
        maxWidth: "calc(100vw - 32px)",
        borderRadius: 18,
        overflow: "hidden",
        zIndex: 80,
        border:
          theme === "dark"
            ? "1px solid rgba(51,65,85,0.9)"
            : "1px solid rgba(226,232,240,1)",
        background: theme === "dark" ? "rgba(15,23,42,0.98)" : "rgba(255,255,255,0.98)",
        boxShadow:
          theme === "dark"
            ? "0 20px 50px rgba(0,0,0,0.45)"
            : "0 20px 50px rgba(15,23,42,0.16)",
        backdropFilter: "blur(12px)",
      };

  const profileActionStyle: CSSProperties = {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  };

  const mobileBackdropStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.28)",
    backdropFilter: "blur(2px)",
    zIndex: 70,
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "default",
  };

  // ✅ Gap between header and cards when offline panel is not shown
  const catalogSectionTopSpace = offlineSubjects.length === 0 && !isOffline ? 24 : 0;

  if (!mounted || status === "loading" || status === "unauthenticated") {
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

          <div className="mt-6 rounded-2xl p-6 bg-white/70 border border-slate-200">
            Loading…
          </div>
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
                <h3 className="text-2xl sm:text-2xl font-bold tracking-tight truncate">
                  Tutorial Dashboard
                </h3>

                <div
                  className={
                    theme === "dark" ? "text-sm text-slate-300" : "text-sm text-slate-700"
                  }
                >
                  {isOffline ? "🔴 Offline" : "🟢 Online"} • {subjects.length} subjects •{" "}
                  {offlineSubjects.length} offline saved
                </div>

                {lastOfflineSavedAt && (
                  <div
                    className={
                      theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-600"
                    }
                  >
                    Saved at: {formatDate(lastOfflineSavedAt)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className={btnOutline} onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>

              <div ref={profileRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  title={displayName}
                  style={profileButtonStyle}
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 500,
                        fontSize: 13,
                        color: "#111827",
                        background:
                          "linear-gradient(135deg, rgba(250,204,21,1), rgba(234,179,8,1))",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                  )}

                  <div className="hidden sm:block text-left min-w-0">
                    <div className="text-sm font-bold truncate max-w-[150px]">{displayName}</div>
                    <div
                      className={`text-xs truncate max-w-[180px] ${
                        theme === "dark" ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {displayEmail}
                    </div>
                  </div>
                </button>

                {profileOpen && isMobileView && (
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    onClick={() => setProfileOpen(false)}
                    style={mobileBackdropStyle}
                  />
                )}

                {profileOpen && (
                  <div style={profileMenuStyle}>
                    <div
                      style={{
                        padding: isMobileView ? 14 : 16,
                        borderBottom:
                          theme === "dark"
                            ? "1px solid rgba(51,65,85,0.8)"
                            : "1px solid rgba(226,232,240,1)",
                      }}
                    > 
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        {session?.user?.image ? (
                          <img
                            src={session.user.image}
                            alt={displayName}
                            className="w-5 h-5 rounded-full object-cover border border-slate-300"
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 999,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 500,
                              fontSize: 14,
                              color: "#111827",
                              background:
                                "linear-gradient(135deg, rgba(250,204,21,1), rgba(234,179,8,1))",
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                        )}

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: isMobileView ? 16 : 18,
                              lineHeight: 1.2,
                            }}
                          >
                            Hi, {displayName}!
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              marginTop: 6,
                              color: theme === "dark" ? "#94a3b8" : "#64748b",
                              wordBreak: "break-word",
                            }}
                          >
                            {displayEmail}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setProfileOpen(false)}
                          aria-label="Close profile menu"
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: 4,
                            color: theme === "dark" ? "#cbd5e1" : "#475569",
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseAnotherAccount}
                      style={{
                        ...profileActionStyle,
                        color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                        borderBottom:
                          theme === "dark"
                            ? "1px solid rgba(51,65,85,0.6)"
                            : "1px solid rgba(241,245,249,1)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          lineHeight: 1,
                          display: "inline-flex",
                          width: 14,
                          justifyContent: "center",
                        }}
                      >
                      </span>
                      Use another account
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        ...profileActionStyle,
                        color: theme === "dark" ? "#fca5a5" : "#dc2626",
                      }}
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className={`flex items-center gap-3 ${searchCard}`}>
              <FaSearch className={theme === "dark" ? "text-slate-300" : "text-slate-500"} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search subjects or topics..."
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

        {/* Offline subjects */}
        {offlineSubjects.length > 0 && (
          <div
            className="card"
            style={{
              padding: 16,
              marginTop: 18,
              marginBottom: 28,
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 10,
              }}
            >
              {offlineSubjects.map((s) => (
                <div
                  key={s.subject}
                  style={{
                    textAlign: "left",
                    background:
                      theme === "dark" ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.70)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "12px 14px",
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
                  <div style={{ fontWeight: 800, fontSize: 14, textTransform: "capitalize" }}>
                    {s.subject}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
                    {s.topicCount} topics
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                    Saved {formatDate(s.savedAt)}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/subject/${encodeURIComponent(s.subject)}`)}
                      style={{
                        flex: 1,
                        borderRadius: 10,
                        padding: "8px 10px",
                        border: "1px solid var(--border)",
                        background:
                          theme === "dark" ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.9)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveOfflineSubject(s.subject)}
                      style={{
                        borderRadius: 10,
                        padding: "8px 10px",
                        border: "1px solid rgba(239,68,68,0.28)",
                        background:
                          theme === "dark"
                            ? "rgba(127,29,29,0.18)"
                            : "rgba(254,242,242,0.95)",
                        color: theme === "dark" ? "#fca5a5" : "#dc2626",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      title={`Remove ${s.subject} from offline saved`}
                      aria-label={`Remove ${s.subject} from offline saved`}
                    >
                      <FaTrash style={{ fontSize: 11 }} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline: no saved subjects */}
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

        {/* Catalog */}
        <div style={{ marginTop: catalogSectionTopSpace }}>
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

          {!isOffline && !loading && !err && (
            <>
              {q.trim() && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    margin: "12px 0 10px",
                  }}
                >
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
                    {filteredSubjects.length} match
                    {filteredSubjects.length === 1 ? "" : "es"}
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 14,
                  }}
                >
                  {filteredSubjects.map((s) => {
                    const savedOffline = isSubjectOffline(s.subject);
                    const matchingTopics = (s.topics || []).filter((t) =>
                      normalizeSearch(t.topic_name).includes(normalizeSearch(q))
                    );
                    const hint = q.trim()
                      ? matchingTopics
                          .slice(0, 2)
                          .map((t) => t.topic_name)
                          .join(" • ")
                      : "";

                    return (
                      <Link
                        key={s.subject}
                        href={{
                          pathname: `/subject/${encodeURIComponent(s.subject)}`,
                          query: { readme: s.readme_url },
                        }}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
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
                                background:
                                  theme === "dark"
                                    ? "rgba(2,6,23,0.35)"
                                    : "rgba(255,255,255,0.8)",
                                fontWeight: 900,
                              }}
                            >
                              {(s.subject || "S").trim().charAt(0).toUpperCase()}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 900,
                                  textTransform: "capitalize",
                                  paddingRight: savedOffline ? 60 : 0,
                                  lineHeight: 1.2,
                                }}
                              >
                                {s.subject}
                              </div>
                              <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>
                                {s.topics?.length || 0} topics
                              </div>
                            </div>
                          </div>

                          {q.trim() && hint && (
                            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                              Matching topics:{" "}
                              <span style={{ color: "inherit", fontWeight: 700 }}>{hint}</span>
                            </div>
                          )}

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
                                borderColor: "rgba(56,189,248,0.35)",
                                color: "var(--brand-2)",
                              }}
                            >
                              Explore
                            </span>
                            <span style={{ fontWeight: 900, color: "var(--brand-2)" }}>
                              Open →
                            </span>
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
    </div>
  );
}