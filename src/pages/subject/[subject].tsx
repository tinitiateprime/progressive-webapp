// File: src/pages/subject/[subject].tsx

import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import {
  FaArrowLeft,
  FaMoon,
  FaSearch,
  FaSun,
  FaDownload,
  FaCheckCircle,
  FaHome,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

type Topic = {
  topic_name: string;
  md_url: string;
  bullets?: string[]; // preview bullets from subject README
  section_markdown?: string; // optional section content (for future use)
};

type FavTopic = {
  slug: string;
  topic_name: string;
  subject: string;
};

type OfflineSubjectMeta = {
  subject: string;
  savedAt: number;
  topicCount: number;
  topics: Topic[];
  subject_readme_url?: string;
};

type MainCatalogSubjectLink = {
  subject: string;
  readme_url: string; // raw URL
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAIN_README_BLOB_URL =
  "https://github.com/tinitiateprime/tinitiate_it_traning_app/blob/main/README.md";

const CACHE_NAME = "tinitiate-offline-v1";
const OFFLINE_PREFIX = "offline_subject_";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const toRawGithub = (u: string) => {
  const m = u.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );
  if (!m) return u;
  const [, owner, repo, branch, path] = m;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};

const cleanTitle = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // remove markdown link syntax
    .replace(/\s*\*\s*https?:\/\/.*$/i, "")
    .replace(/\s*https?:\/\/.*$/i, "")
    .trim();

const extractFirstUrl = (text: string) => {
  const m = text.match(/\bhttps?:\/\/[^\s)]+/);
  if (!m) return "";
  let url = m[0].replace(/[)\],]+$/g, "");
  if (url.includes("github.com/") && url.includes("/blob/")) url = toRawGithub(url);
  return url;
};

const resolveMaybeRelativeUrl = (url: string, baseUrl?: string) => {
  if (!url) return "";
  const u = url.trim();

  if (/^https?:\/\//i.test(u)) return toRawGithub(u);

  if (baseUrl) {
    try {
      const resolved = new URL(u, baseUrl).toString();
      return toRawGithub(resolved);
    } catch {
      // ignore
    }
  }

  return u;
};

const extractMarkdownLinkAnywhere = (
  text: string,
  baseUrl?: string
): { title: string; url: string } | null => {
  // Supports heading text like:
  // 📘 [Introduction](./01-introduction.md)
  // [projectsetup](./projectsetup.md)
  const m = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!m) return null;

  const title = cleanTitle(m[1]);
  const url = resolveMaybeRelativeUrl(m[2].trim(), baseUrl);

  return url ? { title, url } : null;
};

const parseBulletsFromSection = (sectionText: string): string[] => {
  const bullets: string[] = [];
  const lines = (sectionText || "").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // - item / * item / + item
    let m = line.match(/^[-*+]\s+(.+)$/);
    if (m) {
      bullets.push(m[1].trim());
      continue;
    }

    // 1. item
    m = line.match(/^\d+\.\s+(.+)$/);
    if (m) {
      bullets.push(m[1].trim());
      continue;
    }
  }

  return bullets;
};

/**
 * Parses the MAIN README catalog:
 * ## [Vue JS](https://github.com/.../README.md)
 */
function parseMainCatalogReadme(md: string): MainCatalogSubjectLink[] {
  const lines = (md || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim());

  const results: MainCatalogSubjectLink[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (!h2) continue;

    const body = h2[1].trim();
    const link = extractMarkdownLinkAnywhere(body);

    if (!link) continue;

    const key = `${normalize(link.title)}|${link.url}`;
    if (seen.has(key)) continue;

    results.push({
      subject: link.title,
      readme_url: toRawGithub(link.url),
    });

    seen.add(key);
  }

  return results;
}

/**
 * Parses SUBJECT README format like:
 * ## 📘 [Introduction](./01-introduction.md)
 * - bullet
 * - bullet
 * ---
 * ## 🚀 [Getting Started](./02-getting-started.md)
 * ...
 *
 * IMPORTANT:
 * - We treat "## ..." as topic sections
 * - We only create topic if the heading (or nearby lines) contains an .md link
 * - We capture bullets under that heading until next heading of same/higher level
 */
function parseSubjectReadmeTopics(md: string, subjectReadmeUrl: string): Topic[] {
  const lines = (md || "").replace(/\r/g, "\n").split("\n");

  type Hit = {
    index: number;
    title: string;
    url: string;
    level: number; // usually 2
  };

  const hits: Hit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (!h) continue;

    const level = h[1].length;
    const headingBody = h[2].trim();

    // ✅ Subject README topic entries are expected at level 2 (## ...)
    // Ignore other levels (like ### Conclusion)
    if (level !== 2) continue;

    let title = "";
    let url = "";

    // Case A: heading contains markdown link
    const mdLink = extractMarkdownLinkAnywhere(headingBody, subjectReadmeUrl);
    if (mdLink) {
      title = mdLink.title;
      url = mdLink.url;
    } else {
      // Case B: heading text + URL on next non-heading line(s)
      title = cleanTitle(headingBody);

      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (/^#{1,6}\s+/.test(next)) break;

        const nextMdLink = extractMarkdownLinkAnywhere(next, subjectReadmeUrl);
        if (nextMdLink) {
          url = nextMdLink.url;
          break;
        }

        const directUrl = extractFirstUrl(next);
        if (directUrl) {
          url = resolveMaybeRelativeUrl(directUrl, subjectReadmeUrl);
          break;
        }
      }
    }

    // Only keep markdown topic files
    if (!title || !url || !/\.md(\?|#|$)/i.test(url)) continue;

    hits.push({ index: i, title, url, level });
  }

  const topics: Topic[] = [];
  const seen = new Set<string>();

  for (let idx = 0; idx < hits.length; idx++) {
    const hit = hits[idx];
    const start = hit.index + 1;

    let end = lines.length;
    for (let j = start; j < lines.length; j++) {
      const m = lines[j].trim().match(/^(#{1,6})\s+(.*)$/);
      if (!m) continue;

      const nextLevel = m[1].length;
      if (nextLevel <= hit.level) {
        end = j;
        break;
      }
    }

    const sectionContent = lines.slice(start, end).join("\n").trim();
    const bullets = parseBulletsFromSection(sectionContent);

    const key = `${normalize(hit.title)}|${hit.url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    topics.push({
      topic_name: hit.title,
      md_url: toRawGithub(hit.url),
      bullets,
      section_markdown: sectionContent,
    });
  }

  return topics;
}

const orderTopics = (raw: Topic[]) => {
  const introIdx = raw.findIndex((t) => normalize(t.topic_name) === "introduction");
  return introIdx > 0 ? [raw[introIdx], ...raw.filter((_, i) => i !== introIdx)] : raw;
};

// ─── Helpers: localStorage ────────────────────────────────────────────────────

const readOfflineMeta = (key: string): OfflineSubjectMeta | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.topics)) return parsed as OfflineSubjectMeta;
  } catch {}
  return null;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

// ✅ fetch with fallback proxy (helps when direct fetch fails)
async function fetchTextRobust(url: string, signal?: AbortSignal) {
  try {
    const res = await fetch(url, { cache: "no-store", signal });
    if (res.ok) return await res.text();
  } catch {
    // continue to proxy
  }

  const res2 = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
    cache: "no-store",
    signal,
  });

  if (!res2.ok) {
    throw new Error(`Fetch failed: ${res2.status}`);
  }

  return await res2.text();
}

// ✅ Cache-first text loader
async function loadTextCacheFirst(url: string, signal: AbortSignal) {
  let cachedText: string | null = null;

  if ("caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) cachedText = await cached.text();
    } catch {}
  }

  const result: { cached: string | null; fresh: string | null } = {
    cached: cachedText,
    fresh: null,
  };

  try {
    const fresh = await fetchTextRobust(url, signal);
    result.fresh = fresh;

    if ("caches" in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(
          url,
          new Response(fresh, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      } catch {}
    }
  } catch {
    // ignore network failures
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubjectPage() {
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { subject, readme } = router.query;
  const subjectStr = String(subject || "");
  const readmeQueryUrl = typeof readme === "string" ? readme : "";

  const subjectKey = useMemo(
    () => `${OFFLINE_PREFIX}${normalize(subjectStr)}`,
    [subjectStr]
  );

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectReadmeUrl, setSubjectReadmeUrl] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [q, setQ] = useState("");

  const [favorites, setFavorites] = useState<FavTopic[]>([]);

  const [savingOffline, setSavingOffline] = useState(false);
  const [offlineSavedAt, setOfflineSavedAt] = useState<number | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!subjectStr) return;
    const meta = readOfflineMeta(subjectKey);
    setOfflineSavedAt(meta?.savedAt ?? null);
    if (meta?.subject_readme_url) setSubjectReadmeUrl(meta.subject_readme_url);
  }, [subjectStr, subjectKey]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/favorites", {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        if (!res.ok) return;
        setFavorites(await res.json());
      } catch {}
    })();
  }, []);

  // ── fetch topics from SUBJECT README (new format) ───────────────────────────
  useEffect(() => {
    if (!router.isReady || !subjectStr) return;

    const ac = new AbortController();
    let cancelled = false;

    const loadFromOffline = (): boolean => {
      const meta = readOfflineMeta(subjectKey);
      if (!meta) return false;

      setTopics(meta.topics || []);
      setError("");
      setOfflineSavedAt(meta.savedAt ?? null);
      if (meta.subject_readme_url) setSubjectReadmeUrl(meta.subject_readme_url);
      return true;
    };

    const applySubjectReadme = (md: string, sourceUrl: string) => {
      const parsed = parseSubjectReadmeTopics(md, sourceUrl);
      const ordered = orderTopics(parsed);

      setSubjectReadmeUrl(sourceUrl);

      if (!ordered.length) {
        setTopics([]);
        setError(`No topics found in subject README for "${subjectStr}".`);
        return;
      }

      setTopics(ordered);
      setError("");
    };

    const resolveSubjectReadmeFromMainCatalog = (mainMd: string): string => {
      const catalog = parseMainCatalogReadme(mainMd);
      const match = catalog.find((s) => normalize(s.subject) === normalize(subjectStr));
      return match?.readme_url ? toRawGithub(match.readme_url) : "";
    };

    const hadOffline = loadFromOffline();
    setLoading(!hadOffline);

    // Offline and no saved data
    if (!navigator.onLine && !hadOffline) {
      setError("You're offline and no saved copy exists for this subject.");
      setLoading(false);
      return () => ac.abort();
    }

    (async () => {
      try {
        setRefreshing(true);

        // 1) If dashboard passes ?readme=... use it directly (fastest + safest)
        let resolvedSubjectReadme = readmeQueryUrl ? toRawGithub(readmeQueryUrl) : "";

        // 2) Fallback: resolve from main catalog README
        if (!resolvedSubjectReadme) {
          const mainReadmeRaw = toRawGithub(MAIN_README_BLOB_URL);
          const { cached: mainCached, fresh: mainFresh } = await loadTextCacheFirst(
            mainReadmeRaw,
            ac.signal
          );
          if (cancelled) return;

          if (mainCached) {
            resolvedSubjectReadme = resolveSubjectReadmeFromMainCatalog(mainCached);
          }
          if (!resolvedSubjectReadme && mainFresh) {
            resolvedSubjectReadme = resolveSubjectReadmeFromMainCatalog(mainFresh);
          }
        }

        if (!resolvedSubjectReadme) {
          throw new Error(`Subject "${subjectStr}" not found in main catalog README`);
        }

        const { cached, fresh } = await loadTextCacheFirst(resolvedSubjectReadme, ac.signal);
        if (cancelled) return;

        if (cached) {
          applySubjectReadme(cached, resolvedSubjectReadme);
          setLoading(false);
        }

        if (fresh && fresh !== cached) {
          applySubjectReadme(fresh, resolvedSubjectReadme);
        }

        if (!cached && !fresh) {
          throw new Error("Subject README fetch returned no data");
        }
      } catch (e) {
        console.error("Subject load error:", e);
        if (!hadOffline && !cancelled) {
          setError("Failed to load subject (and no offline copy found).");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [router.isReady, subjectStr, subjectKey, readmeQueryUrl]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return qq ? topics.filter((t) => t.topic_name.toLowerCase().includes(qq)) : topics;
  }, [topics, q]);

  const handleSaveOffline = async () => {
    if (!topics.length) return;

    setSavingOffline(true);
    setSaveProgress({ done: 0, total: topics.length });

    try {
      if (!("caches" in window)) {
        alert("Your browser does not support offline cache (Cache Storage).");
        return;
      }

      const cache = await caches.open(CACHE_NAME);

      // Cache main README
      try {
        const mainRaw = toRawGithub(MAIN_README_BLOB_URL);
        const text = await fetchTextRobust(mainRaw);
        await cache.put(
          mainRaw,
          new Response(text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      } catch {}

      // Cache subject README
      if (subjectReadmeUrl) {
        try {
          const text = await fetchTextRobust(subjectReadmeUrl);
          await cache.put(
            subjectReadmeUrl,
            new Response(text, {
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        } catch {}
      }

      // Save subject meta
      const meta: OfflineSubjectMeta = {
        subject: subjectStr,
        savedAt: Date.now(),
        topicCount: topics.length,
        topics,
        subject_readme_url: subjectReadmeUrl || undefined,
      };
      localStorage.setItem(subjectKey, JSON.stringify(meta));
      setOfflineSavedAt(meta.savedAt);

      // Cache each topic markdown
      for (let i = 0; i < topics.length; i++) {
        const url = toRawGithub(topics[i].md_url);
        try {
          const resText = await fetchTextRobust(url);
          await cache.put(
            url,
            new Response(resText, {
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        } catch {
          // ignore
        } finally {
          setSaveProgress({ done: i + 1, total: topics.length });
        }
      }
    } finally {
      setSavingOffline(false);
    }
  };

  const toggleFavorite = async (topic: FavTopic) => {
    const isFavorite = favorites.some((f) => f.slug === topic.slug);
    const prev = favorites;

    setFavorites(
      isFavorite ? favorites.filter((f) => f.slug !== topic.slug) : [...favorites, topic]
    );

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

      if (!res.ok) {
        setFavorites(prev);
        return;
      }

      setFavorites(await res.json());
    } catch {
      setFavorites(prev);
    }
  };

  // ─── UI classes ─────────────────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
            Loading…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className={headerCard}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src="/favicon_new.png" alt="Tinitiate" className="w-10 h-10 rounded-xl" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {subjectStr ? subjectStr.toUpperCase() : "SUBJECT"}
                </h1>

                <div className={theme === "dark" ? "text-sm text-slate-300" : "text-sm text-slate-700"}>
                  {isOffline ? "🔴 Offline" : "🟢 Online"}
                  {refreshing ? " • Updating…" : ""} • {topics.length} topics
                  {offlineSavedAt ? " • Offline saved" : ""}
                </div>

                {offlineSavedAt && (
                  <div className={theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-600"}>
                    Saved at: {formatDate(offlineSavedAt)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className={btnOutline} onClick={() => router.push("/")} type="button" title="Home">
                <FaHome />
              </button>

              <button
                className={btnOutline}
                onClick={handleSaveOffline}
                type="button"
                disabled={savingOffline || topics.length === 0}
                title="Save subject and topic markdown files for offline reading"
              >
                {savingOffline ? (
                  <>
                    <FaDownload className="animate-bounce" />
                    Saving {saveProgress.done}/{saveProgress.total}
                  </>
                ) : offlineSavedAt ? (
                  <>
                    <FaCheckCircle className="text-green-500" />
                    Update Offline
                  </>
                ) : (
                  <>
                    <FaDownload />
                    Save Offline
                  </>
                )}
              </button>

              <button className={btnOutline} onClick={() => router.push("/dashboard")} type="button">
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
              <FaSearch className={theme === "dark" ? "text-slate-300" : "text-slate-500"} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topics…"
                className={`w-full bg-transparent outline-none text-sm ${
                  theme === "dark" ? "placeholder:text-slate-500" : "placeholder:text-slate-400"
                }`}
              />
            </div>
          </div>
        </div>

        {loading && <div className={searchCard + " p-6"}>Loading topics…</div>}
        {!loading && error && <div className={searchCard + " p-6 text-red-500"}>{error}</div>}

        {!loading && !error && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t, i) => {
                const slug = slugify(t.topic_name);
                const isFav = favorites.some((f) => f.slug === slug);
                const isIntro = normalize(t.topic_name) === "introduction";

                // ✅ pass subject README URL so Topic page can re-read bullets/subtopics later
                const hrefObj = {
                  pathname: `/topic/${encodeURIComponent(t.topic_name)}`,
                  query: {
                    subject: subjectStr,
                    ...(subjectReadmeUrl ? { readme: subjectReadmeUrl } : {}),
                  },
                };

                return (
                  <div
                    key={`${t.md_url}-${t.topic_name}`}
                    className={(isIntro ? introCard : topicCard) + " cursor-pointer"}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-no-nav="true"]')) return;
                      router.push(hrefObj);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") router.push(hrefObj);
                    }}
                  >
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
                        toggleFavorite({ slug, topic_name: t.topic_name, subject: subjectStr });
                      }}
                      className={`absolute top-4 right-4 z-50 pointer-events-auto text-xl transition-transform hover:scale-125 ${
                        theme === "dark" ? "text-yellow-300" : "text-yellow-400"
                      }`}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFav ? "★" : "☆"}
                    </button>

                    <div className={theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                      {isIntro ? "Start here" : `#${i + 1}`}
                    </div>

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

                    {/* ✅ show bullet preview from subject README (if present) */}
                    {!!t.bullets?.length && (
                      <div className="mt-3 space-y-1">
                        {t.bullets.slice(0, 3).map((b, idx) => (
                          <div
                            key={idx}
                            className={theme === "dark" ? "text-xs text-slate-400" : "text-xs text-slate-600"}
                          >
                            • {b}
                          </div>
                        ))}
                      </div>
                    )}

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
              <p className={theme === "dark" ? "text-center text-slate-400 text-sm" : "text-center text-slate-500 text-sm"}>
                No topics found
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}