"use client";

import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { FaArrowLeft, FaMoon, FaSearch, FaSun, FaDownload, FaCheckCircle } from "react-icons/fa";

type Topic = { topic_name: string; md_url: string };

type FavTopic = {
  slug: string;
  topic_name: string;
  subject: string;
};

// ✅ Source: tinitiate_it_traning_app README (RAW)
const README_RAW_URL =
  "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/README.md";

const CACHE_NAME = "tinitiate-offline-v1";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Convert GitHub blob URL -> raw URL (required for fetch) */
const toRawGithub = (u: string) => {
  const m = u.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );
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
 * Subject:
 *   ## Vue JS
 * Topics:
 *   ### Introduction
 *   https://raw....
 */
const parseSubjectsFromReadme = (md: string) => {
  const lines = (md || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const map = new Map<string, Topic[]>();
  let currentSubject = "";

  const ensure = (subjectName: string) => {
    const key = cleanTitle(subjectName);
    if (!map.has(key)) map.set(key, []);
    return key;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // SUBJECT: "## Vue JS" but ignore "## Catalog 1/2/3"
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      const heading = h2[1].trim();
      if (/^catalog\s*\d*/i.test(heading)) continue;
      currentSubject = ensure(heading);
      continue;
    }

    // TOPIC: "### Introduction" and URL usually next line
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3 && currentSubject) {
      const topicTitle = cleanTitle(h3[1]);

      // URL can be on same line OR next lines until next heading
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

      // keep only markdown links
      if (url && /\.md(\?|$)/i.test(url)) {
        const arr = map.get(currentSubject) || [];
        if (!arr.some((t) => t.md_url === url)) {
          arr.push({ topic_name: topicTitle, md_url: url });
          map.set(currentSubject, arr);
        }
      }
    }
  }

  return map; // Map<subject, topics[]>
};

export default function SubjectPage() {
  const router = useRouter();
  const { subject } = router.query;
  const subjectStr = String(subject || "");
  const subjectKey = useMemo(() => `offline_subject_${normalize(subjectStr)}`, [subjectStr]);

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [q, setQ] = useState("");

  const [favorites, setFavorites] = useState<FavTopic[]>([]);

  // ✅ offline save states
  const [savingOffline, setSavingOffline] = useState(false);
  const [offlineSavedAt, setOfflineSavedAt] = useState<number | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  // online/offline watcher (status only)
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

  // load offline meta (savedAt) for this subject
  useEffect(() => {
    if (!subjectStr) return;
    try {
      const raw = localStorage.getItem(subjectKey);
      if (!raw) {
        setOfflineSavedAt(null);
        return;
      }
      const parsed = JSON.parse(raw);
      setOfflineSavedAt(typeof parsed?.savedAt === "number" ? parsed.savedAt : null);
    } catch {
      setOfflineSavedAt(null);
    }
  }, [subjectStr, subjectKey]);

  // load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await fetch("/api/favorites", {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        if (!res.ok) return;
        const favs: FavTopic[] = await res.json();
        setFavorites(favs);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };

    loadFavorites();
  }, []);

  // ✅ fetch topics from README
  useEffect(() => {
    if (!router.isReady || !subjectStr) return;

    const loadFromOffline = () => {
      try {
        const raw = localStorage.getItem(subjectKey);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.topics)) {
          setTopics(parsed.topics);
          setError("");
          setOfflineSavedAt(typeof parsed?.savedAt === "number" ? parsed.savedAt : null);
          return true;
        }
      } catch {}
      return false;
    };

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(README_RAW_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`README fetch failed: ${res.status}`);

        const text = await res.text();
        const map = parseSubjectsFromReadme(text);

        const wanted = normalize(subjectStr);
        const matchKey =
          Array.from(map.keys()).find((k) => normalize(k) === wanted) || "";

        if (!matchKey) {
          setTopics([]);
          setError(`Subject "${subjectStr}" not found in README`);
          return;
        }

        const subjectTopics = map.get(matchKey) || [];

        // Introduction first
        const introIdx = subjectTopics.findIndex(
          (t) => normalize(t.topic_name) === "introduction"
        );

        let ordered = subjectTopics;
        if (introIdx > 0) {
          const intro = subjectTopics[introIdx];
          ordered = [intro, ...subjectTopics.filter((_, i) => i !== introIdx)];
        }

        setTopics(ordered);
      } catch (err) {
        console.error("Failed to load subject:", err);

        // ✅ offline fallback
        const ok = loadFromOffline();
        if (!ok) {
          setTopics([]);
          setError("Failed to load subject (and no offline copy found)");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router.isReady, subjectStr, subjectKey]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return topics;
    return topics.filter((t) => t.topic_name.toLowerCase().includes(qq));
  }, [topics, q]);

  // ✅ Save Offline (cache markdown + store topic list)
  const handleSaveOffline = async () => {
    if (!topics.length) return;

    setSavingOffline(true);
    setSaveProgress({ done: 0, total: topics.length });

    try {
      if (typeof window === "undefined") return;

      // Cache API support check
      const hasCache = "caches" in window;
      if (!hasCache) {
        alert("Your browser does not support offline cache (Cache Storage).");
        return;
      }

      const cache = await caches.open(CACHE_NAME);

      // (optional) cache README too
      try {
        const r = await fetch(README_RAW_URL, { cache: "no-store" });
        if (r.ok) await cache.put(README_RAW_URL, r.clone());
      } catch {}

      // Save meta + topics list
      const meta = {
        subject: subjectStr,
        savedAt: Date.now(),
        topicCount: topics.length,
        topics,
      };
      localStorage.setItem(subjectKey, JSON.stringify(meta));
      setOfflineSavedAt(meta.savedAt);

      // Cache each markdown url
      for (let i = 0; i < topics.length; i++) {
        const url = topics[i].md_url;
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            await cache.put(url, res.clone());
          }
        } catch (e) {
          // ignore per-file failures
        } finally {
          setSaveProgress((p) => ({ ...p, done: i + 1 }));
        }
      }
    } finally {
      setSavingOffline(false);
    }
  };

  // ✅ Favorites toggle (POST/DELETE)
  const toggleFavorite = async (topic: FavTopic) => {
    const isFavorite = favorites.some((f) => f.slug === topic.slug);

    // optimistic UI
    const optimistic = isFavorite
      ? favorites.filter((f) => f.slug !== topic.slug)
      : [...favorites, topic];
    const prev = favorites;
    setFavorites(optimistic);

    try {
      const url = isFavorite
        ? `/api/favorites?slug=${encodeURIComponent(topic.slug)}`
        : `/api/favorites`;

      const res = await fetch(url, {
        method: isFavorite ? "DELETE" : "POST",
        headers: isFavorite
          ? { "Cache-Control": "no-store" }
          : { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: isFavorite ? undefined : JSON.stringify(topic),
        cache: "no-store",
      });

      if (res.status === 404) {
        console.error(
          "API route not found: /api/favorites. Create pages/api/favorites.ts OR src/app/api/favorites/route.ts"
        );
        setFavorites(prev);
        return;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Favorite toggle failed:", res.status, msg);
        setFavorites(prev);
        return;
      }

      const updated: FavTopic[] = await res.json();
      setFavorites(updated);
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setFavorites(prev);
    }
  };

  // --------- UI classes ----------
  const pageBg =
    theme === "dark"
      ? "min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100"
      : "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900";

  const headerCard =
    theme === "dark"
      ? "rounded-2xl p-6 bg-gradient-to-r from-slate-900 to-slate-800 shadow-md border border-slate-800"
      : "rounded-2xl p-6 bg-gradient-to-r from-cyan-100 to-blue-100 shadow-md";

  const searchCard =
    theme === "dark"
      ? "rounded-2xl p-3 bg-slate-900/70 border border-slate-800 shadow-sm"
      : "rounded-2xl p-3 bg-white border border-slate-200 shadow-sm";

  const topicCard =
    theme === "dark"
      ? `relative rounded-3xl p-6 shadow-lg transition-all duration-300
         bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border border-slate-800
         hover:from-slate-800 hover:via-slate-900 hover:to-slate-950
         hover:-translate-y-2 hover:shadow-2xl`
      : `relative rounded-3xl p-6 shadow-lg transition-all duration-300
         bg-gradient-to-tr from-blue-50 via-white to-cyan-50
         hover:from-blue-100 hover:via-cyan-100 hover:to-white
         hover:-translate-y-2 hover:shadow-2xl`;

  const introCard =
    theme === "dark"
      ? `relative rounded-3xl p-6 shadow-xl transition-all duration-300
         bg-gradient-to-tr from-cyan-500/15 via-slate-950 to-slate-900 border border-cyan-500/30
         hover:-translate-y-2 hover:shadow-2xl`
      : `relative rounded-3xl p-6 shadow-xl transition-all duration-300
         bg-gradient-to-tr from-blue-100 via-white to-cyan-100 border border-blue-200
         hover:-translate-y-2 hover:shadow-2xl`;

  const btnBase =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";
  const btnOutline =
    theme === "dark"
      ? `${btnBase} border border-slate-700 bg-slate-900 hover:bg-slate-800`
      : `${btnBase} border border-slate-200 bg-white hover:bg-slate-50`;

  return (
    <div className={pageBg}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Header */}
        <div className={headerCard}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src="/favicon_new.png"
                alt="Tinitiate"
                className="w-10 h-10 rounded-xl"
              />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {subjectStr ? subjectStr.toUpperCase() : "SUBJECT"}
                </h1>
                <div
                  className={
                    theme === "dark"
                      ? "text-sm text-slate-300"
                      : "text-sm text-slate-700"
                  }
                >
                  {isOffline ? "Offline" : "Online"} • {topics.length} topics
                  {offlineSavedAt ? " • Offline saved" : ""}
                </div>

                {offlineSavedAt && (
                  <div className={theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-600"}>
                    Saved at: {new Date(offlineSavedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* ✅ Save Offline Button */}
              <button
                className={btnOutline}
                onClick={handleSaveOffline}
                type="button"
                disabled={savingOffline || topics.length === 0}
                title="Save all topic cards (markdown) for offline reading"
              >
                {savingOffline ? (
                  <>
                    <FaDownload />
                    Saving {saveProgress.done}/{saveProgress.total}
                  </>
                ) : offlineSavedAt ? (
                  <>
                    <FaCheckCircle />
                    Saved Offline
                  </>
                ) : (
                  <>
                    <FaDownload />
                    Save Offline
                  </>
                )}
              </button>

              <button
                className={btnOutline}
                onClick={() => router.push("/dashboard")}
                type="button"
              >
                <FaArrowLeft /> Back
              </button>

              <button className={btnOutline} onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className={`flex items-center gap-3 flex-1 ${searchCard}`}>
              <FaSearch
                className={theme === "dark" ? "text-slate-300" : "text-slate-500"}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topics…"
                className={`w-full bg-transparent outline-none text-sm ${
                  theme === "dark"
                    ? "placeholder:text-slate-500"
                    : "placeholder:text-slate-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && <div className={searchCard + " p-6"}>Loading topics…</div>}
        {!loading && error && (
          <div className={searchCard + " p-6 text-red-500"}>{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t, i) => {
                const slug = slugify(t.topic_name);
                const isFav = favorites.some((f) => f.slug === slug);
                const isIntro = normalize(t.topic_name) === "introduction";

                const href = `/topic/${encodeURIComponent(
                  t.topic_name
                )}?subject=${encodeURIComponent(subjectStr)}`;

                return (
                  <div
                    key={t.md_url}
                    className={(isIntro ? introCard : topicCard) + " cursor-pointer"}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      const el = e.target as HTMLElement;
                      if (el.closest('[data-no-nav="true"]')) return;
                      router.push(href);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") router.push(href);
                    }}
                  >
                    {/* Favorite Star */}
                    <button
                      data-no-nav="true"
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite({
                          slug,
                          topic_name: t.topic_name,
                          subject: subjectStr,
                        });
                      }}
                      className={`absolute top-4 right-4 z-50 pointer-events-auto text-xl transition-transform hover:scale-125 ${
                        theme === "dark" ? "text-yellow-300" : "text-yellow-400"
                      }`}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFav ? "★" : "☆"}
                    </button>

                    <div
                      className={
                        theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-500"
                      }
                    >
                      {isIntro ? "Start here" : `#${i + 1}`}
                    </div>

                    {/* ✅ CARD NAME (Title) */}
                    <div className="mt-2">
                      <div
                        className={
                          theme === "dark"
                            ? "text-[11px] uppercase tracking-wider text-slate-400"
                            : "text-[11px] uppercase tracking-wider text-slate-500"
                        }
                      >
                        Card Name
                      </div>

                      <h3 className="mt-1 text-lg font-semibold leading-snug line-clamp-2">
                        {t.topic_name}
                      </h3>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isIntro && (
                        <span className="text-xs px-3 py-1 rounded-full bg-cyan-100 text-cyan-800">
                          ✅ Recommended first
                        </span>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div
                        className={
                          theme === "dark"
                            ? "text-sm font-medium text-cyan-300"
                            : "text-sm font-medium text-blue-600"
                        }
                      >
                        Open →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p
                className={
                  theme === "dark"
                    ? "text-center text-slate-400 text-sm"
                    : "text-center text-slate-500 text-sm"
                }
              >
                No topics found
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}