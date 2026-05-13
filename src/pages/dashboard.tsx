"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
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
  FaStar,
  FaSun,
  FaTimes,
  FaUserTie,
} from "react-icons/fa";

import TickerBar from "../components/content/TickerBar";
import { ThemeContext } from "../context/ThemeContext";
import { clearBrowserSessionActive } from "../lib/browserSession";
import { fetchContentRepoStatus, fetchTickerItems } from "../lib/content-client";
import type { TickerItem } from "../lib/content-types";
import { buildPublicEntryUrl } from "../lib/public-entry";
import {
  getLibraryUserKey,
  hydrateOfflineSubjectsForAccount,
  mergeFavoriteTopics,
  readFavoriteTopics,
  type SavedFavoriteTopic,
  writeFavoriteTopics,
} from "../lib/library";
import { readAllOfflineSubjectMetas, type OfflineSubjectMeta } from "../lib/offline";

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

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const accountKey = useMemo(() => getLibraryUserKey(session?.user), [session]);

  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [q, setQ] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [syncingContent, setSyncingContent] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [favoriteTopics, setFavoriteTopics] = useState<SavedFavoriteTopic[]>([]);
  const [offlineSubjects, setOfflineSubjects] = useState<OfflineSubjectMeta[]>([]);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installInstalled, setInstallInstalled] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(buildPublicEntryUrl(router.asPath));
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    for (const route of ["/interview", "/courses", "/cbt"]) {
      router.prefetch(route).catch(() => undefined);
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
    const syncLibrary = () => {
      setFavoriteTopics(readFavoriteTopics(accountKey));
      setOfflineSubjects(readAllOfflineSubjectMetas(accountKey));
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
          setFavoriteTopics(mergedFavorites);
        }

        if (!cancelled && offlineRes.ok) {
          const serverOfflineSubjects = (await offlineRes.json()) as OfflineSubjectMeta[];
          const hydrated = hydrateOfflineSubjectsForAccount(serverOfflineSubjects, accountKey);
          setOfflineSubjects(hydrated);
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
        setSyncingContent(true);
        const [items, statusInfo] = await Promise.all([
          fetchTickerItems(controller.signal),
          fetchContentRepoStatus(controller.signal),
        ]);
        if (cancelled) return;

        setTickerItems(items);
        setLastSyncedAt(statusInfo.updatedAt ? Date.parse(statusInfo.updatedAt) : null);
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setTickerItems([]);
          setLastSyncedAt(null);
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

  const filteredOfflineSubjects = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return offlineSubjects;

    return offlineSubjects.filter((item) => normalizeSearch(item.subject).includes(query));
  }, [offlineSubjects, q]);

  const syncStatusText = isOffline
    ? lastSyncedAt
      ? `Last GitHub update ${formatDateTime(lastSyncedAt)}`
      : "Offline mode is active"
    : syncingContent
      ? "Checking GitHub content..."
      : lastSyncedAt
        ? `GitHub updated ${formatDateTime(lastSyncedAt)}`
        : "GitHub update time is unavailable right now.";

  const secondaryStatusText = isOffline
    ? favoriteTopics.length || offlineSubjects.length
      ? "Library mode is active. Saved favorites and offline subjects are ready."
      : "Library mode is active, but this device does not have saved items yet."
    : offlineSubjects[0]?.subject
      ? `Recent offline copy: ${offlineSubjects[0].subject}`
      : "Open any section online once to keep it ready for offline reading later.";

  const searchPlaceholder = isOffline
    ? "Search saved topics or offline subjects..."
    : "Search interview, courses, or CBT...";

  const openFavorite = (item: SavedFavoriteTopic) => {
    setLibraryOpen(false);
    router.push({
      pathname: `/topic/${encodeURIComponent(item.topic_name)}`,
      query: {
        subject: item.subject,
        ...(item.subject_readme_url ? { readme: item.subject_readme_url } : {}),
      },
    });
  };

  const openOfflineSubject = (item: OfflineSubjectMeta) => {
    setLibraryOpen(false);
    router.push({
      pathname: `/subject/${encodeURIComponent(item.subject)}`,
      query: {
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
                Logout
              </button>
            </div>
          </div>

          <div className="card search-bar-elevated page-hero-search">
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
        </section>

        {!isOffline && tickerItems.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <TickerBar items={tickerItems} />
          </section>
        )}

        <section style={{ display: "grid", gap: 14 }}>
          {!isOffline &&
            filteredSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.key}
                href={section.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="card"
                  style={{
                    padding: "22px 24px",
                    borderRadius: 26,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    background: theme === "dark" ? section.surfaceDark : section.surfaceLight,
                    border: "1px solid color-mix(in srgb, var(--border) 92%, transparent)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 18,
                        display: "grid",
                        placeItems: "center",
                        background:
                          theme === "dark"
                            ? "color-mix(in srgb, var(--surface) 86%, transparent)"
                            : "color-mix(in srgb, var(--surface) 90%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--border) 86%, transparent)",
                        color: section.accent,
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "clamp(20px, 2.2vw, 26px)", fontWeight: 900, lineHeight: 1.15 }}>
                        {section.title}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                        {section.description}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      color: section.accent,
                      flexShrink: 0,
                    }}
                  >
                    Open
                    <FaArrowRight />
                  </div>
                </div>
              </Link>
            );
          })}

          {isOffline && (
            <>
              {filteredFavoriteTopics.length > 0 && (
                <div className="card" style={{ padding: 22, borderRadius: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        display: "grid",
                        placeItems: "center",
                        color: "var(--dashboard-library-favorites-color)",
                        background: "var(--dashboard-library-favorites-background)",
                        border: "1px solid var(--dashboard-library-favorites-border)",
                      }}
                    >
                      <FaStar />
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>Saved Favorites</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>
                        Open your saved topics even when the internet is unavailable.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredFavoriteTopics.map((item) => (
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
                    ))}
                  </div>
                </div>
              )}

              {filteredOfflineSubjects.length > 0 && (
                <div className="card" style={{ padding: 22, borderRadius: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        display: "grid",
                        placeItems: "center",
                        color: "var(--dashboard-library-offline-color)",
                        background: "var(--dashboard-library-offline-background)",
                        border: "1px solid var(--dashboard-library-offline-border)",
                      }}
                    >
                      <FaDownload />
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>Saved Offline Subjects</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>
                        Reopen subjects that were downloaded on this device.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredOfflineSubjects.map((item) => (
                      <button
                        key={item.subject}
                        className="btn btn-outline"
                        type="button"
                        onClick={() => openOfflineSubject(item)}
                        style={{
                          justifyContent: "space-between",
                          padding: "14px 16px",
                          borderRadius: 18,
                          width: "100%",
                        }}
                      >
                        <span style={{ display: "grid", textAlign: "left", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 15, fontWeight: 800 }}>{item.subject}</span>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {item.topicCount} topic{item.topicCount === 1 ? "" : "s"} saved
                          </span>
                        </span>
                        <FaArrowRight />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!isOffline && filteredSections.length === 0 && (
            <div className="card" style={{ padding: 22, borderRadius: 24, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                No section matched your search. Try "interview", "courses", or "cbt".
              </div>
            </div>
          )}

          {isOffline &&
            filteredFavoriteTopics.length === 0 &&
            filteredOfflineSubjects.length === 0 && (
              <div className="card" style={{ padding: 22, borderRadius: 24, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Offline library is empty</div>
                <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                  Save a subject or add a favorite while online, and it will appear here when you go offline.
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
                  Favorites and offline subjects saved on this account.
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
                  {favoriteTopics.length > 0 ? (
                    favoriteTopics.map((item) => (
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
                      No favorites saved yet.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)", marginBottom: 10 }}>
                  OFFLINE SUBJECTS
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {offlineSubjects.length > 0 ? (
                    offlineSubjects.map((item) => (
                      <button
                        key={item.subject}
                        className="btn btn-outline"
                        type="button"
                        onClick={() => openOfflineSubject(item)}
                        style={{
                          justifyContent: "space-between",
                          padding: "14px 16px",
                          borderRadius: 18,
                          width: "100%",
                        }}
                      >
                        <span style={{ display: "grid", textAlign: "left", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 15, fontWeight: 800 }}>{item.subject}</span>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {item.topicCount} topic{item.topicCount === 1 ? "" : "s"} saved
                          </span>
                        </span>
                        <FaArrowRight />
                      </button>
                    ))
                  ) : (
                    <div className="soft" style={{ padding: 14, borderRadius: 18, fontSize: 13, color: "var(--muted)" }}>
                      No offline subject saved yet.
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

export { requireAuthenticatedPage as getServerSideProps } from "../lib/require-auth-page";
