"use client";

import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaDownload,
  FaHome,
  FaMoon,
  FaSearch,
  FaStar,
  FaSun,
} from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeContext";
import { resolveCourseSubject } from "../../lib/content-client";
import {
  getLibraryUserKey,
  hydrateOfflineSubjectsForAccount,
  mergeFavoriteTopics,
  readFavoriteTopics,
  removeFavoriteTopic,
  setActiveLibraryUserKey,
  upsertFavoriteTopic,
  writeFavoriteTopics,
  type SavedFavoriteTopic,
} from "../../lib/library";
import {
  CACHE_NAME,
  cacheTextUrls,
  migrateLegacyOfflineSubjects,
  readOfflineSubjectMeta,
  writeOfflineSubjectMeta,
  type OfflineSubjectMeta,
} from "../../lib/offline";
import {
  fetchTextStrict,
  parseSubjectTopicsFromReadme,
  toRawGithub,
  type ParsedTopic,
} from "../../lib/readme-utils";

type Topic = ParsedTopic;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const readOfflineMeta = (subject: string, accountKey?: string) =>
  readOfflineSubjectMeta(subject, accountKey);

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const orderTopics = (topics: Topic[]) => {
  const introIndex = topics.findIndex(
    (topic) => topic.topic_name.toLowerCase().replace(/[^a-z0-9]/g, "") === "introduction"
  );

  if (introIndex <= 0) return topics;
  return [topics[introIndex], ...topics.filter((_, index) => index !== introIndex)];
};

async function cacheTextContent(url: string, text: string) {
  if (!("caches" in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      url,
      new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  } catch {
    // ignore cache write failures
  }
}

async function fetchAndCacheText(url: string, signal: AbortSignal) {
  const fresh = await fetchTextStrict(url, signal);
  await cacheTextContent(url, fresh);
  return fresh;
}

export default function SubjectPage() {
  const router = useRouter();
  const { subject, readme } = router.query;
  const subjectStr = String(subject || "");
  const readmeQueryUrl = typeof readme === "string" ? readme : "";
  const { data: session, status } = useSession();
  const accountKey = useMemo(() => getLibraryUserKey(session?.user), [session]);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectReadmeUrl, setSubjectReadmeUrl] = useState("");
  const [favorites, setFavorites] = useState<SavedFavoriteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });
  const [offlineSavedAt, setOfflineSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

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
    if (!accountKey) return;
    setActiveLibraryUserKey(accountKey);
    migrateLegacyOfflineSubjects(accountKey);
  }, [accountKey]);

  useEffect(() => {
    setFavorites(readFavoriteTopics(accountKey));
  }, [accountKey]);

  useEffect(() => {
    if (!subjectStr) return;
    const meta = readOfflineMeta(subjectStr, accountKey);
    setOfflineSavedAt(meta?.savedAt ?? null);
    if (meta?.subject_readme_url) setSubjectReadmeUrl(meta.subject_readme_url);
  }, [subjectStr, accountKey]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    (async () => {
      try {
        const [favoritesRes, offlineRes] = await Promise.all([
          fetch("/api/favorites", {
            cache: "no-store",
            headers: { "Cache-Control": "no-store" },
          }),
          fetch("/api/offline-subjects", {
            cache: "no-store",
            headers: { "Cache-Control": "no-store" },
          }),
        ]);

        if (!cancelled && favoritesRes.ok) {
          const serverFavorites = (await favoritesRes.json()) as SavedFavoriteTopic[];
          const mergedFavorites = mergeFavoriteTopics(readFavoriteTopics(accountKey), serverFavorites);
          writeFavoriteTopics(mergedFavorites, accountKey);
          setFavorites(mergedFavorites);
        }

        if (!cancelled && offlineRes.ok) {
          const serverOfflineSubjects = (await offlineRes.json()) as OfflineSubjectMeta[];
          hydrateOfflineSubjectsForAccount(serverOfflineSubjects, accountKey);

          if (subjectStr) {
            const meta = readOfflineMeta(subjectStr, accountKey);
            setOfflineSavedAt(meta?.savedAt ?? null);
            if (meta?.subject_readme_url) setSubjectReadmeUrl(meta.subject_readme_url);
          }
        }
      } catch {
        // keep local state when sync fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountKey, status, subjectStr]);

  useEffect(() => {
    if (!router.isReady || !subjectStr) return;

    const controller = new AbortController();
    let cancelled = false;

    const applyReadme = (markdown: string, sourceUrl: string) => {
      const parsed = orderTopics(parseSubjectTopicsFromReadme(markdown, sourceUrl));
      setSubjectReadmeUrl(sourceUrl);

      if (!parsed.length) {
        setTopics([]);
        setError(`No topics found in "${subjectStr}".`);
        return;
      }

      setTopics(parsed);
      setError("");
    };

    const loadOfflineCopy = () => {
      const meta = readOfflineMeta(subjectStr, accountKey);
      if (!meta) return false;

      setTopics(meta.topics || []);
      setError("");
      setOfflineSavedAt(meta.savedAt ?? null);
      if (meta.subject_readme_url) setSubjectReadmeUrl(meta.subject_readme_url);
      return true;
    };

    const hadOfflineCopy = !navigator.onLine && loadOfflineCopy();
    setLoading(!hadOfflineCopy);

    if (!navigator.onLine) {
      if (!hadOfflineCopy) {
        setError("You're offline and no saved copy exists for this subject.");
        setLoading(false);
      }

      return () => controller.abort();
    }

    (async () => {
      try {
        let resolvedReadmeUrl = readmeQueryUrl ? toRawGithub(readmeQueryUrl) : "";

        if (!resolvedReadmeUrl) {
          const fromCatalog = await resolveCourseSubject(subjectStr, controller.signal);
          if (cancelled) return;
          resolvedReadmeUrl = fromCatalog?.readme_url || "";
        }

        if (!resolvedReadmeUrl) {
          throw new Error(`Subject "${subjectStr}" not found in course catalog`);
        }

        const fresh = await fetchAndCacheText(resolvedReadmeUrl, controller.signal);
        if (cancelled) return;

        applyReadme(fresh, resolvedReadmeUrl);
      } catch {
        if (!cancelled) {
          setError("Failed to load the subject content.");
          setTopics([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accountKey, readmeQueryUrl, router.isReady, subjectStr]);

  const filteredTopics = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return topics;

    return topics.filter((topic) => {
      if (normalizeSearch(topic.topic_name).includes(query)) return true;
      return (topic.bullets || []).some((bullet) => normalizeSearch(bullet).includes(query));
    });
  }, [q, topics]);

  const handleSaveOffline = async () => {
    if (!topics.length) return;

    setSavingOffline(true);
    setSaveProgress({ done: 0, total: 0 });

    try {
      const meta: OfflineSubjectMeta = {
        subject: subjectStr,
        savedAt: Date.now(),
        topicCount: topics.length,
        topics,
        subject_readme_url: subjectReadmeUrl || undefined,
      };

      const urlsToCache = [
        ...(subjectReadmeUrl ? [subjectReadmeUrl] : []),
        ...topics.map((topic) => topic.md_url),
      ];

      const cacheResult = await cacheTextUrls(urlsToCache, fetchTextStrict, (done, total) => {
        setSaveProgress({ done, total });
      });

      const savedSubjectReadme =
        !subjectReadmeUrl || cacheResult.savedUrls.includes(toRawGithub(subjectReadmeUrl));

      if (!savedSubjectReadme || cacheResult.savedUrls.length === 0) {
        throw new Error("Could not save the required files for offline use.");
      }

      writeOfflineSubjectMeta(meta, accountKey);
      setOfflineSavedAt(meta.savedAt);

      if (status === "authenticated") {
        await fetch("/api/offline-subjects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
          body: JSON.stringify(meta),
          cache: "no-store",
        }).catch(() => undefined);
      }

      if (cacheResult.failedUrls.length > 0) {
        window.alert(
          `Saved offline with ${cacheResult.failedUrls.length} skipped file(s). Some topic content may be limited offline.`
        );
        return;
      }

      window.alert(`Saved "${subjectStr}" for offline.`);
    } catch {
      window.alert("Offline save failed. Please try again while online.");
    } finally {
      setSavingOffline(false);
    }
  };

  const toggleFavorite = async (topic: Topic) => {
    const slug = slugify(topic.topic_name);
    const existingFavorite = favorites.some((favorite) => favorite.slug === slug);

    if (existingFavorite) {
      const nextFavorites = removeFavoriteTopic(slug, accountKey);
      setFavorites(nextFavorites);

      if (status === "authenticated") {
        try {
          const res = await fetch(`/api/favorites?slug=${encodeURIComponent(slug)}`, {
            method: "DELETE",
            headers: { "Cache-Control": "no-store" },
            cache: "no-store",
          });

          if (res.ok) {
            const serverFavorites = (await res.json()) as SavedFavoriteTopic[];
            const mergedFavorites = mergeFavoriteTopics(nextFavorites, serverFavorites);
            writeFavoriteTopics(mergedFavorites, accountKey);
            setFavorites(mergedFavorites);
          }
        } catch {
          // keep local state if server sync fails
        }
      }

      return;
    }

    try {
      const cacheResult = await cacheTextUrls(
        [
          ...(subjectReadmeUrl ? [subjectReadmeUrl] : []),
          ...(topic.md_url ? [topic.md_url] : []),
        ],
        fetchTextStrict
      );

      const savedTopicMd =
        !topic.md_url || cacheResult.savedUrls.includes(toRawGithub(topic.md_url));
      const savedSubjectReadme =
        !subjectReadmeUrl || cacheResult.savedUrls.includes(toRawGithub(subjectReadmeUrl));

      if (!savedTopicMd || !savedSubjectReadme) {
        throw new Error("Favorite cache is incomplete.");
      }
    } catch {
      window.alert("Could not save this favorite for offline use. Please try again while online.");
      return;
    }

    const nextFavorite: SavedFavoriteTopic = {
      slug,
      topic_name: topic.topic_name,
      subject: subjectStr,
      md_url: topic.md_url,
      subject_readme_url: subjectReadmeUrl || undefined,
      savedAt: Date.now(),
    };

    const nextFavorites = upsertFavoriteTopic(nextFavorite, accountKey);
    setFavorites(nextFavorites);

    if (status === "authenticated") {
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
          body: JSON.stringify(nextFavorite),
          cache: "no-store",
        });

        if (res.ok) {
          const serverFavorites = (await res.json()) as SavedFavoriteTopic[];
          const mergedFavorites = mergeFavoriteTopics(nextFavorites, serverFavorites);
          writeFavoriteTopics(mergedFavorites, accountKey);
          setFavorites(mergedFavorites);
        }
      } catch {
        // keep local state if server sync fails
      }
    }
  };

  return (
    <div className="app-shell">
      <main className="page-main">
        <div className="card page-hero-card">
          <div className="page-hero-top">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                COURSE SUBJECT
              </div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                {subjectStr || "Loading subject..."}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                Open any topic to continue reading, save it offline, or mark it as a favorite.
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                Status: {isOffline ? "Offline" : "Online"}
              </div>
              {offlineSavedAt && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Offline saved at: {formatDate(offlineSavedAt)}
                </div>
              )}
            </div>

            <div className="page-hero-actions">
              <button className="btn btn-outline" onClick={() => router.push("/dashboard")} type="button">
                <FaHome />
              </button>
              <button
                className="btn btn-outline"
                onClick={handleSaveOffline}
                type="button"
                disabled={savingOffline || topics.length === 0}
              >
                {savingOffline ? (
                  <>
                    <FaDownload />
                    Saving {saveProgress.done}/{saveProgress.total}
                  </>
                ) : offlineSavedAt ? (
                  <>
                    <FaCheckCircle />
                    Update Offline
                  </>
                ) : (
                  <>
                    <FaDownload />
                    Save Offline
                  </>
                )}
              </button>
              <button className="btn btn-outline" onClick={() => router.back()} type="button">
                <FaArrowLeft /> Back
              </button>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18 }} className="card search-bar-elevated page-hero-search">
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
              <FaSearch />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search topics or bullet points..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--text)",
                }}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18 }}>
            Loading topics...
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18, color: "crimson" }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <section
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            {filteredTopics.map((topic, index) => {
              const slug = slugify(topic.topic_name);
              const isFavorite = favorites.some((favorite) => favorite.slug === slug);

              return (
                <div
                  key={`${topic.md_url}-${topic.topic_name}`}
                  className="card"
                  style={{ borderRadius: 22, height: "100%" }}
                >
                  <div
                    style={{
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                          Topic #{index + 1}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, lineHeight: 1.3 }}>
                          {topic.topic_name}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(topic)}
                        className="btn btn-outline"
                        style={{
                          width: 42,
                          height: 42,
                          padding: 0,
                          borderRadius: 14,
                          color: isFavorite ? "var(--brand-strong)" : undefined,
                        }}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <FaStar />
                      </button>
                    </div>

                    {!!topic.bullets?.length && (
                      <div style={{ marginTop: 14, display: "grid", gap: 8, flex: 1 }}>
                        {topic.bullets.slice(0, 4).map((bullet) => (
                          <div key={bullet} className="soft" style={{ padding: "8px 10px", borderRadius: 14, fontSize: 12 }}>
                            {bullet}
                          </div>
                        ))}
                      </div>
                    )}

                    {!topic.bullets?.length && (
                      <div
                        className="soft"
                        style={{
                          marginTop: 14,
                          padding: "10px 12px",
                          borderRadius: 14,
                          fontSize: 12,
                          color: "var(--muted)",
                          flex: 1,
                        }}
                      >
                        Open the topic to read the full lesson content.
                      </div>
                    )}

                    <div style={{ marginTop: 16, paddingTop: 2 }}>
                      <button
                        className="btn btn-primary"
                        type="button"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() =>
                          router.push({
                            pathname: `/topic/${encodeURIComponent(topic.topic_name)}`,
                            query: {
                              subject: subjectStr,
                              ...(subjectReadmeUrl ? { readme: subjectReadmeUrl } : {}),
                            },
                          })
                        }
                      >
                        Open Topic
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export { requireAuthenticatedPage as getServerSideProps } from "../../lib/require-auth-page";
