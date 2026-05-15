"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBars,
  FaBookOpen,
  FaDownload,
  FaLayerGroup,
  FaMoon,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaTimes,
  FaUserTie,
} from "react-icons/fa";

import TickerBar from "../components/content/TickerBar";
import { ThemeContext } from "../context/ThemeContext";
import { clearCachedSessionUser, useProtectedAppSession } from "../lib/app-session";
import { clearBrowserSessionActive } from "../lib/browserSession";
import {
  fetchCbtCollections,
  fetchContentRepoStatus,
  fetchCourseSubjects,
  fetchInterviewQuestions,
  fetchTickerItems,
} from "../lib/content-client";
import type {
  CbtCollections,
  CourseSubject,
  InterviewQuestionSummary,
  TickerItem,
} from "../lib/content-types";
import {
  OFFLINE_SYNC_STATE_EVENT,
  readOfflineSyncState,
} from "../lib/offline-sync";
import { clearAppRouteHistory } from "../lib/navigation";
import { useConnectionStatus } from "../lib/use-connection-status";
import {
  getLibraryUserKey,
  mergeFavoriteTopics,
  readFavoriteTopics,
  type SavedFavoriteTopic,
  writeFavoriteTopics,
} from "../lib/library";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type SectionCard = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: IconType;
  accent: string;
  surfaceLight: string;
  surfaceDark: string;
  keywords: string[];
};

type DashboardSearchResult = {
  key: string;
  kind: string;
  title: string;
  description: string;
  meta: string;
  href: string | { pathname: string; query: Record<string, string> };
  icon: IconType;
  accent: string;
};

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const getSearchTokens = (value: string) =>
  normalizeSearch(value).split(/\s+/).filter(Boolean);

const matchesSearchTokens = (tokens: string[], ...values: Array<string | undefined>) => {
  if (tokens.length === 0) return true;
  const haystack = normalizeSearch(values.filter(Boolean).join(" "));
  return tokens.every((token) => haystack.includes(token));
};

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useProtectedAppSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const accountKey = useMemo(() => getLibraryUserKey(session?.user), [session]);
  const isOffline = useConnectionStatus();

  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [courses, setCourses] = useState<CourseSubject[]>([]);
  const [interviewItems, setInterviewItems] = useState<InterviewQuestionSummary[]>([]);
  const [cbtCollections, setCbtCollections] = useState<CbtCollections | null>(null);
  const [q, setQ] = useState("");
  const [syncingContent, setSyncingContent] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [offlineSyncState, setOfflineSyncState] = useState<ReturnType<typeof readOfflineSyncState>>(null);
  const [favoriteTopics, setFavoriteTopics] = useState<SavedFavoriteTopic[]>([]);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installInstalled, setInstallInstalled] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const hasLoadedStatusRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    for (const route of ["/interview", "/courses", "/cbt"]) {
      router.prefetch(route).catch(() => undefined);
    }
  }, [router, status]);

  useEffect(() => {
    const syncLibrary = () => {
      setFavoriteTopics(readFavoriteTopics(accountKey));
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncLibrary();
      }
    };

    syncLibrary();
    window.addEventListener("focus", syncLibrary);
    window.addEventListener("storage", syncLibrary);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", syncLibrary);
      window.removeEventListener("storage", syncLibrary);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [accountKey]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    (async () => {
      try {
        const favoritesRes = await fetch("/api/favorites", {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });

        if (!cancelled && favoritesRes.ok) {
          const serverFavorites = (await favoritesRes.json()) as SavedFavoriteTopic[];
          const mergedFavorites = mergeFavoriteTopics(readFavoriteTopics(accountKey), serverFavorites);
          writeFavoriteTopics(mergedFavorites, accountKey);
          setFavoriteTopics(mergedFavorites);
        }
      } catch {
        // keep local library state when sync fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountKey, status]);

  useEffect(() => {
    const refresh = () => setOfflineSyncState(readOfflineSyncState());
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(OFFLINE_SYNC_STATE_EVENT, refresh as EventListener);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(OFFLINE_SYNC_STATE_EVENT, refresh as EventListener);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone) {
      setInstallInstalled(true);
    }

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        if (!hasLoadedStatusRef.current) {
          setSyncingContent(true);
        }
        const results = await Promise.allSettled([
          fetchTickerItems(controller.signal),
          fetchContentRepoStatus(controller.signal),
          fetchCourseSubjects(controller.signal),
          fetchInterviewQuestions(controller.signal),
          fetchCbtCollections(controller.signal),
        ]);
        if (cancelled) return;

        if (results[0].status === "fulfilled") {
          setTickerItems(results[0].value);
        }
        if (results[1].status === "fulfilled") {
          setLastSyncedAt(results[1].value.updatedAt ? Date.parse(results[1].value.updatedAt) : null);
        }
        if (results[2].status === "fulfilled") {
          setCourses(results[2].value);
        }
        if (results[3].status === "fulfilled") {
          setInterviewItems(results[3].value);
        }
        if (results[4].status === "fulfilled") {
          setCbtCollections(results[4].value);
        }
        hasLoadedStatusRef.current = true;
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          if (!hasLoadedStatusRef.current) {
            setTickerItems([]);
            setLastSyncedAt(null);
          }
        }
      } finally {
        if (!cancelled) {
          setSyncingContent(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status]);

  const handleLogout = async () => {
    clearBrowserSessionActive();
    clearCachedSessionUser();
    clearAppRouteHistory();

    try {
      await signOut({ redirect: false });
    } catch {
      // ignore
    }

    router.replace("/");
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => undefined);
    setInstallPrompt(null);
  };

  const logoSrc = theme === "dark" ? "/TinitiateLogo.png" : "/TinitiateLogoLight.png";
  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] || session?.user?.email?.split("@")[0] || "Learner";
  const accountInitial = firstName.charAt(0).toUpperCase() || "L";
  const accountEmail = session?.user?.email || "";
  const connectionTone = isOffline
    ? {
        label: "Offline",
        color: "var(--status-offline-color)",
        background: "var(--status-offline-background)",
        border: "var(--status-offline-border)",
      }
    : {
        label: "Online",
        color: "var(--status-online-color)",
        background: "var(--status-online-background)",
        border: "var(--status-online-border)",
      };

  const sectionCards = useMemo<SectionCard[]>(
    () => [
      {
        key: "interview",
        title: "Interview Questions",
        description: "Open the interview library and practice concise, high-signal answers.",
        href: "/interview",
        icon: FaUserTie,
        accent: "var(--dashboard-section-interview-accent)",
        surfaceLight: "var(--dashboard-section-interview-surface)",
        surfaceDark: "var(--dashboard-section-interview-surface)",
        keywords: ["interview", "questions", "answers", "practice"],
      },
      {
        key: "courses",
        title: "Courses",
        description: "Browse subjects and open topic readers from the GitHub course catalog.",
        href: "/courses",
        icon: FaBookOpen,
        accent: "var(--dashboard-section-courses-accent)",
        surfaceLight: "var(--dashboard-section-courses-surface)",
        surfaceDark: "var(--dashboard-section-courses-surface)",
        keywords: ["courses", "subjects", "topics", "learning"],
      },
      {
        key: "cbt",
        title: "CBT",
        description: "Jump into slideshows, training videos, and audio books in one place.",
        href: "/cbt",
        icon: FaLayerGroup,
        accent: "var(--dashboard-section-cbt-accent)",
        surfaceLight: "var(--dashboard-section-cbt-surface)",
        surfaceDark: "var(--dashboard-section-cbt-surface)",
        keywords: ["cbt", "slideshows", "videos", "audio", "media"],
      },
    ],
    []
  );

  const filteredSections = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return sectionCards;

    return sectionCards.filter((section) => {
      if (normalizeSearch(section.title).includes(query)) return true;
      if (normalizeSearch(section.description).includes(query)) return true;
      return section.keywords.some((keyword) => normalizeSearch(keyword).includes(query));
    });
  }, [q, sectionCards]);

  const filteredFavoriteTopics = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return favoriteTopics;

    return favoriteTopics.filter((item) => {
      if (normalizeSearch(item.topic_name).includes(query)) return true;
      return normalizeSearch(item.subject).includes(query);
    });
  }, [favoriteTopics, q]);

  const searchResults = useMemo<DashboardSearchResult[]>(() => {
    const tokens = getSearchTokens(q);
    if (tokens.length === 0) return [];

    const results: DashboardSearchResult[] = [];
    const seen = new Set<string>();
    const addResult = (result: DashboardSearchResult) => {
      if (seen.has(result.key)) return;
      seen.add(result.key);
      results.push(result);
    };

    for (const course of courses) {
      if (
        matchesSearchTokens(
          tokens,
          course.subject,
          course.title,
          course.category,
          course.level,
          course.summary,
          ...course.topics.map((topic) => topic.topic_name)
        )
      ) {
        addResult({
          key: `course:${course.slug}`,
          kind: "Course",
          title: course.subject,
          description: course.summary,
          meta: `${course.category} - ${course.level} - ${course.topics.length} topics`,
          href: {
            pathname: "/subject/[subject]",
            query: { subject: course.subject, readme: course.readme_url },
          },
          icon: FaBookOpen,
          accent: "var(--dashboard-section-courses-accent)",
        });
      }

      for (const topic of course.topics) {
        if (
          !matchesSearchTokens(
            tokens,
            topic.topic_name,
            ...(topic.bullets || []),
            topic.section_markdown
          )
        ) {
          continue;
        }

        addResult({
          key: `topic:${course.slug}:${topic.md_url || topic.topic_name}`,
          kind: "Topic",
          title: topic.topic_name,
          description: course.subject,
          meta: "Course topic",
          href: {
            pathname: "/topic/[topic]",
            query: {
              topic: topic.topic_name,
              subject: course.subject,
              ...(course.readme_url ? { readme: course.readme_url } : {}),
            },
          },
          icon: FaBookOpen,
          accent: "var(--dashboard-section-courses-accent)",
        });
      }
    }

    for (const item of interviewItems) {
      if (
        !matchesSearchTokens(
          tokens,
          item.title,
          item.category,
          item.level,
          item.question,
          item.excerpt,
          ...item.tags
        )
      ) {
        continue;
      }

      addResult({
        key: `interview:${item.slug}`,
        kind: "Interview",
        title: item.title,
        description: item.question,
        meta: `${item.category} - ${item.level}`,
        href: {
          pathname: "/interview/[slug]",
          query: { slug: item.slug },
        },
        icon: FaUserTie,
        accent: "var(--dashboard-section-interview-accent)",
      });
    }

    for (const deck of cbtCollections?.slideshows || []) {
      if (!matchesSearchTokens(tokens, deck.title, deck.summary, deck.audience, ...deck.tags)) {
        continue;
      }

      addResult({
        key: `slideshow:${deck.slug}`,
        kind: "Slideshow",
        title: deck.title,
        description: deck.summary,
        meta: deck.audience,
        href: {
          pathname: "/cbt/slides/[slug]",
          query: { slug: deck.slug },
        },
        icon: FaLayerGroup,
        accent: "var(--dashboard-section-cbt-accent)",
      });
    }

    for (const item of [
      ...(cbtCollections?.trainingVideos || []).map((entry) => ({ ...entry, kind: "Training Video" })),
      ...(cbtCollections?.audioBooks || []).map((entry) => ({ ...entry, kind: "Audio Book" })),
    ]) {
      if (!matchesSearchTokens(tokens, item.title, item.summary, item.speaker, ...item.tags)) {
        continue;
      }

      addResult({
        key: `media:${item.kind}:${item.slug}`,
        kind: item.kind,
        title: item.title,
        description: item.summary,
        meta: item.speaker,
        href: {
          pathname: "/cbt/media/[slug]",
          query: {
            slug: item.slug,
            kind: item.kind === "Training Video" ? "training-videos" : "audio-books",
          },
        },
        icon: FaLayerGroup,
        accent: "var(--dashboard-section-cbt-accent)",
      });
    }

    for (const item of favoriteTopics) {
      if (!matchesSearchTokens(tokens, item.topic_name, item.subject)) {
        continue;
      }

      addResult({
        key: `favorite:${item.subject}:${item.slug}`,
        kind: "Favorite",
        title: item.topic_name,
        description: item.subject,
        meta: "Saved topic",
        href: {
          pathname: "/topic/[topic]",
          query: {
            topic: item.topic_name,
            subject: item.subject,
            ...(item.subject_readme_url ? { readme: item.subject_readme_url } : {}),
          },
        },
        icon: FaBookOpen,
        accent: "var(--dashboard-library-favorites-color)",
      });
    }

    return results.slice(0, 12);
  }, [cbtCollections, courses, favoriteTopics, interviewItems, q]);

  const syncStatusText = isOffline
    ? lastSyncedAt
      ? `Last GitHub update ${formatDateTime(lastSyncedAt)}`
      : "Offline mode is active"
    : syncingContent
      ? "Refreshing GitHub content..."
      : lastSyncedAt
        ? `GitHub updated ${formatDateTime(lastSyncedAt)}`
        : "GitHub update time is unavailable right now.";

  const secondaryStatusText =
    offlineSyncState?.status === "ready"
      ? isOffline
        ? `Workspace cached ${formatDateTime(offlineSyncState.syncedAt)}.`
        : `Offline workspace updated ${formatDateTime(offlineSyncState.syncedAt)}.`
      : offlineSyncState?.status === "failed"
        ? "Offline workspace needs another refresh."
        : isOffline
          ? "Offline mode is active. This device is waiting for a full online sync."
          : "Preparing the workspace for offline use.";

  const searchPlaceholder = "Search Java, topics, interview questions, videos...";

  const openFavorite = (item: SavedFavoriteTopic) => {
    setLibraryOpen(false);
    router.push({
      pathname: "/topic/[topic]",
      query: {
        topic: item.topic_name,
        subject: item.subject,
        ...(item.subject_readme_url ? { readme: item.subject_readme_url } : {}),
      },
    });
  };

  return (
    <div className="app-shell app-shell--dashboard">
      <main className="page-main">
        <section
          className="card page-hero-card page-hero-card--dashboard"
          style={{
            marginBottom: 16,
          }}
        >
          <div className="page-hero-top" style={{ gap: 16 }}>
            <div className="page-hero-brand" style={{ gap: 18 }}>
              <Image
                src={logoSrc}
                alt="Tinitiate"
                width={1720}
                height={181}
                style={{ width: 190, maxWidth: "46vw", height: "auto", objectFit: "contain" }}
              />

              <div className="page-hero-copy">
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "var(--text)",
                    fontWeight: 700,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>{syncStatusText}</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 11px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      color: connectionTone.color,
                      background: connectionTone.background,
                      border: `1px solid ${connectionTone.border}`,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: connectionTone.color,
                        display: "inline-block",
                      }}
                    />
                    {connectionTone.label}
                  </span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                  {secondaryStatusText}
                </div>
              </div>
            </div>

            <div className="page-hero-actions">
              {installPrompt && !installInstalled && (
                <button className="btn btn-outline" onClick={handleInstall} type="button">
                  <FaDownload />
                  Install
                </button>
              )}

              <button className="btn btn-outline" onClick={() => setLibraryOpen(true)} type="button">
                <FaBars />
                <span className="hide-mobile">Library</span>
              </button>

              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <div
                className="btn btn-outline dashboard-profile-btn"
                style={{
                  pointerEvents: "none",
                }}
                title={accountEmail ? `${firstName} (${accountEmail})` : firstName}
              >
                <div className="dashboard-profile-btn__avatar">
                  {accountInitial}
                </div>

                <div className="dashboard-profile-btn__copy">
                  <div className="dashboard-profile-btn__name">{firstName}</div>
                </div>
              </div>

              <button className="btn btn-outline" onClick={handleLogout} type="button">
                <FaSignOutAlt />
                <span className="hide-mobile">Logout</span>
              </button>
            </div>
          </div>

          <div className="dashboard-search-tools">
            <div className="card search-bar-elevated page-hero-search dashboard-search-tools__search">
              <FaSearch style={{ color: "var(--muted)", fontSize: 16, flexShrink: 0 }} />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: 15,
                }}
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  type="button"
                  aria-label="Clear search"
                  style={{
                    background: "var(--border)",
                    border: "none",
                    borderRadius: 999,
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--text)",
                    flexShrink: 0,
                  }}
                >
                  x
                </button>
              )}
            </div>

          </div>
        </section>

        {tickerItems.length > 0 && (
          <section className="dashboard-ticker-slot mobile-flat-ticker" style={{ marginBottom: 16 }}>
            <TickerBar items={tickerItems} />
          </section>
        )}

        {q.trim() && searchResults.length > 0 && (
          <section className="dashboard-search-results" style={{ marginBottom: 16 }}>
            <div className="dashboard-search-results__heading">
              Best matches
              <span>{searchResults.length} result{searchResults.length === 1 ? "" : "s"}</span>
            </div>

            <div className="dashboard-search-results__grid">
              {searchResults.map((result) => {
                const Icon = result.icon;

                return (
                  <Link
                    key={result.key}
                    href={result.href}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="card dashboard-search-result-card">
                      <div
                        className="dashboard-search-result-card__icon"
                        style={{ color: result.accent }}
                      >
                        <Icon />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="dashboard-search-result-card__kind">{result.kind}</div>
                        <div className="dashboard-search-result-card__title">{result.title}</div>
                        <div className="dashboard-search-result-card__description">
                          {result.description}
                        </div>
                        <div className="dashboard-search-result-card__meta">{result.meta}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="dashboard-section-list">
          {filteredSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.key}
                href={section.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="card dashboard-section-card"
                  style={{
                    background: theme === "dark" ? section.surfaceDark : section.surfaceLight,
                  }}
                >
                  <div className="dashboard-section-card__main">
                    <div
                      className="dashboard-section-card__icon"
                      style={{
                        background:
                          theme === "dark"
                            ? "color-mix(in srgb, var(--surface) 86%, transparent)"
                            : "color-mix(in srgb, var(--surface) 90%, transparent)",
                        color: section.accent,
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="dashboard-section-card__title">{section.title}</div>
                      <div className="dashboard-section-card__description">{section.description}</div>
                    </div>
                  </div>

                  <div
                    className="dashboard-section-card__open"
                    style={{ color: section.accent }}
                  >
                    Open
                    <FaArrowRight />
                  </div>
                </div>
              </Link>
            );
          })}

          {q.trim() && syncingContent && searchResults.length === 0 && filteredSections.length === 0 && (
            <div className="card" style={{ padding: 22, borderRadius: 24, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                Searching cached content...
              </div>
            </div>
          )}

          {filteredSections.length === 0 && searchResults.length === 0 && !syncingContent && (
            <div className="card" style={{ padding: 22, borderRadius: 24, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                No content matched your search. Try a subject, topic, technology, or question.
              </div>
            </div>
          )}
        </section>
      </main>

      {libraryOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--dashboard-overlay)",
            backdropFilter: "blur(6px)",
            zIndex: 50,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setLibraryOpen(false)}
        >
          <aside
            className="card"
            style={{
              width: "min(420px, 100vw)",
              height: "100vh",
              borderRadius: 0,
              padding: "22px 18px 18px",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Library</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                  Favorite topics saved on this account.
                </div>
              </div>

              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setLibraryOpen(false)}
                style={{ width: 42, height: 42, padding: 0, borderRadius: 14 }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginTop: 22, display: "grid", gap: 18 }}>
              <section>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)", marginBottom: 10 }}>
                  FAVORITES
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredFavoriteTopics.length > 0 ? (
                    filteredFavoriteTopics.map((item) => (
                      <button
                        key={`${item.subject}-${item.slug}`}
                        className="btn btn-outline"
                        type="button"
                        onClick={() => openFavorite(item)}
                        style={{
                          justifyContent: "space-between",
                          padding: "14px 16px",
                          borderRadius: 18,
                          width: "100%",
                        }}
                      >
                        <span style={{ display: "grid", textAlign: "left", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 15, fontWeight: 800 }}>{item.topic_name}</span>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.subject}</span>
                        </span>
                        <FaArrowRight />
                      </button>
                    ))
                  ) : (
                    <div className="soft" style={{ padding: 14, borderRadius: 18, fontSize: 13, color: "var(--muted)" }}>
                      {q ? "No favorites matched your search." : "No favorites saved yet."}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
