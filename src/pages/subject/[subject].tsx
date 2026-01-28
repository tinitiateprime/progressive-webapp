"use client";

import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { FaArrowLeft, FaDownload, FaMoon, FaSearch, FaSun } from "react-icons/fa";

type Topic = { topic_name: string; md_url: string };

type FavTopic = {
  slug: string;
  topic_name: string;
  subject: string;
};

const CATALOG_URL =
  "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

export default function SubjectPage() {
  const router = useRouter();
  const { subject } = router.query;
  const subjectStr = String(subject || "");

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [q, setQ] = useState("");

  const [completed, setCompleted] = useState<string[]>([]);
  const [offlineTopics, setOfflineTopics] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavTopic[]>([]);

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

  // load completed + offline list + favorites
  useEffect(() => {
    try {
      setCompleted(JSON.parse(localStorage.getItem("completedTopics") || "[]"));
      setOfflineTopics(JSON.parse(localStorage.getItem("offlineTopics") || "[]"));
    } catch {
      setCompleted([]);
      setOfflineTopics([]);
    }

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

  // fetch topics
  useEffect(() => {
    if (!router.isReady || !subject) return;

    setLoading(true);
    setError("");

    fetch(CATALOG_URL)
      .then((res) => res.json())
      .then((data) => {
        const found = data.qna_catalog.find(
          (s: any) =>
            String(s.subject || "").toLowerCase() === subjectStr.toLowerCase()
        );
        if (!found) throw new Error("Subject not found");
        setTopics(found.topics || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load subject:", err);
        setError("Failed to load subject");
        setLoading(false);
      });
  }, [router.isReady, subject, subjectStr]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return topics;
    return topics.filter((t) => t.topic_name.toLowerCase().includes(qq));
  }, [topics, q]);

  // progress counts (only topics in this subject)
  const topicSlugSet = useMemo(() => {
    return new Set(topics.map((t) => slugify(t.topic_name)));
  }, [topics]);

  const completedCount = useMemo(
    () => completed.filter((s) => topicSlugSet.has(s)).length,
    [completed, topicSlugSet]
  );

  const offlineCount = useMemo(
    () => offlineTopics.filter((s) => topicSlugSet.has(s)).length,
    [offlineTopics, topicSlugSet]
  );

  // Save whole subject offline (prefetch all URLs)
  const saveSubjectForOffline = async () => {
    if (!("serviceWorker" in navigator))
      return alert("Service Worker not supported");

    const urls = [CATALOG_URL, ...topics.map((t) => t.md_url)];

    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: "PREFETCH_URLS", urls });

      // mark all topic slugs as offline (UI + localStorage)
      const allSlugs = topics.map((t) => slugify(t.topic_name));
      const updated = Array.from(new Set([...offlineTopics, ...allSlugs]));
      setOfflineTopics(updated);
      localStorage.setItem("offlineTopics", JSON.stringify(updated));

      alert(`Saved "${subjectStr}" for offline ✅`);
    } catch (err) {
      console.error("Save subject offline failed:", err);
      alert("Failed to save offline");
    }
  };

  // Save one topic offline
  const saveTopicForOffline = async (slug: string, mdUrl: string) => {
    const updated = Array.from(new Set([...offlineTopics, slug]));
    setOfflineTopics(updated);
    localStorage.setItem("offlineTopics", JSON.stringify(updated));

    if (!("serviceWorker" in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: "PREFETCH_URLS", urls: [CATALOG_URL, mdUrl] });
    } catch (err) {
      console.error("Save topic offline failed:", err);
    }
  };

  // ✅ Favorites toggle (POST/DELETE query param)
const toggleFavorite = async (topic: FavTopic) => {
  const isFavorite = favorites.some((f) => f.slug === topic.slug);

  // ✅ optimistic UI update (instant star toggle)
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

    // ✅ handle 404 clearly (your current problem)
    if (res.status === 404) {
      console.error(
        "API route not found: /api/favorites. Create pages/api/favorites.ts (Pages Router) OR src/app/api/favorites/route.ts (App Router)."
      );
      setFavorites(prev); // rollback
      return;
    }

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      console.error("Favorite toggle failed:", res.status, msg);
      setFavorites(prev); // rollback
      return;
    }

    const updated: FavTopic[] = await res.json();
    setFavorites(updated); // sync with server result
  } catch (err) {
    console.error("Error toggling favorite:", err);
    setFavorites(prev); // rollback
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

  const btnBase =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99]";
  const btnOutline =
    theme === "dark"
      ? `${btnBase} border border-slate-700 bg-slate-900 hover:bg-slate-800`
      : `${btnBase} border border-slate-200 bg-white hover:bg-slate-50`;
  const btnPrimary =
    theme === "dark"
      ? `${btnBase} bg-cyan-500/90 hover:bg-cyan-500 text-slate-950`
      : `${btnBase} bg-blue-600 hover:bg-blue-700 text-white`;

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
                <div className={theme === "dark" ? "text-sm text-slate-300" : "text-sm text-slate-700"}>
                  {isOffline ? "Offline mode" : "Online"} • {topics.length} topics
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className={btnOutline} onClick={() => router.push("/dashboard")} type="button">
                <FaArrowLeft /> Back
              </button>

              <button className={btnPrimary} onClick={saveSubjectForOffline} type="button">
                <FaDownload /> Save Offline
              </button>

              <button className={btnOutline} onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>

          {/* Search + Progress */}
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

            <div className={theme === "dark" ? "text-sm text-slate-300 flex items-center gap-3" : "text-sm text-slate-700 flex items-center gap-3"}>
              <span>
                Progress{" "}
                <span className={theme === "dark" ? "ml-2 px-3 py-1 rounded-full bg-slate-800 text-slate-100" : "ml-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600"}>
                  {completedCount}/{topics.length}
                </span>
              </span>

              <span
                className={theme === "dark" ? "px-3 py-1 rounded-full bg-slate-800 text-slate-100" : "px-3 py-1 rounded-full bg-yellow-50 text-yellow-700"}
                title="Offline topics in this subject"
              >
                Offline: {offlineCount}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && <div className={searchCard + " p-6"}>Loading topics…</div>}
        {!loading && error && <div className={searchCard + " p-6 text-red-500"}>{error}</div>}

        {!loading && !error && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t, i) => {
                const slug = slugify(t.topic_name);
                const isDone = completed.includes(slug);
                const isOff = offlineTopics.includes(slug);
                const isFav = favorites.some((f) => f.slug === slug);

                const href = `/topic/${encodeURIComponent(t.topic_name)}?subject=${encodeURIComponent(subjectStr)}`;

                return (
                  <div
                    key={t.topic_name}
                    className={topicCard + " cursor-pointer"}
                    role="button"
                    tabIndex={0}
                    // ✅ Prevent card navigation when clicking star/save buttons
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
                      #{i + 1}
                    </div>

                    <h3 className="mt-2 font-semibold leading-snug line-clamp-2">
                      {t.topic_name}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isDone && (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                          ✓ Completed
                        </span>
                      )}
                      {isOff && (
                        <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          ⬇ Offline
                        </span>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className={theme === "dark" ? "text-sm font-medium text-cyan-300" : "text-sm font-medium text-blue-600"}>
                        Open →
                      </div>

                      {!isOff && (
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
                            saveTopicForOffline(slug, t.md_url);
                          }}
                          className={theme === "dark" ? "text-xs text-slate-400 hover:text-slate-200" : "text-xs text-slate-500 hover:text-slate-900"}
                        >
                          Save offline
                        </button>
                      )}
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
