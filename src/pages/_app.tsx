import Head from "next/head";
import type { AppProps } from "next/app";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { DesignContext } from "../context/DesignContext";
import { ThemeContext, Theme } from "../context/ThemeContext";
import {
  clearBrowserSessionActive,
  hasBrowserSessionActive,
  markBrowserSessionActive,
} from "../lib/browserSession";
import { clearCachedSessionUser, writeCachedSessionUser } from "../lib/app-session";
import { fetchDesignConfig, warmCoreContent } from "../lib/content-client";
import type { DesignSystem } from "../lib/content-types";
import { syncOfflineWorkspace } from "../lib/offline-sync";
import { buildPublicEntryUrl } from "../lib/public-entry";

const AUTH_SESSION_CHANNEL = "tinitiate.auth.browser-session";
const PUBLIC_BROWSER_SESSION_ROUTES = new Set(["/", "/login", "/signup"]);

const toCssVarKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const applyCssVariables = (design: DesignSystem, theme: Theme) => {
  const root = document.documentElement;
  const themeTokens = design.theme[theme];

  const variables: Record<string, string> = {
    "--bg": themeTokens.bg,
    "--surface": themeTokens.surface,
    "--surface-2": themeTokens.surfaceAlt,
    "--border": themeTokens.border,
    "--text": themeTokens.text,
    "--muted": themeTokens.muted,
    "--brand": themeTokens.brand,
    "--brand-strong": themeTokens.brandStrong,
    "--brand-2": themeTokens.primary,
    "--primary-strong": themeTokens.primaryStrong,
    "--primary-text": themeTokens.primaryText,
    "--focus": themeTokens.focus,
    "--selection": themeTokens.selection,
    "--outline-hover-bg": themeTokens.outlineHoverBg,
    "--outline-hover-border": themeTokens.outlineHoverBorder,
    "--badge-bg": themeTokens.badgeBg,
    "--chip-bg": themeTokens.chipBg,
    "--ticker-bg-start": themeTokens.tickerBgStart,
    "--ticker-bg-end": themeTokens.tickerBgEnd,
    "--code-bg": themeTokens.codeBg,
    "--scrollbar": themeTokens.scrollbar,
    "--shadow-card": themeTokens.shadowCard,
    "--shadow-feature": themeTokens.shadowFeature,
    "--shadow-primary": themeTokens.shadowPrimary,
    "--shadow-primary-hover": themeTokens.shadowPrimaryHover,
    "--search-focus-shadow": themeTokens.searchFocusShadow,
    "--search-focus-border": themeTokens.searchFocusBorder,
    "--page-bg-default":
      theme === "dark"
        ? design.pageBackgrounds.defaultDark
        : design.pageBackgrounds.defaultLight,
    "--page-bg-home":
      theme === "dark" ? design.pageBackgrounds.homeDark : design.pageBackgrounds.homeLight,
    "--page-bg-dashboard":
      theme === "dark"
        ? design.pageBackgrounds.dashboardDark
        : design.pageBackgrounds.dashboardLight,
    "--dashboard-header-bg":
      theme === "dark" ? design.dashboard.headerDark : design.dashboard.headerLight,
    "--dashboard-header-border":
      theme === "dark"
        ? design.dashboard.headerBorderDark
        : design.dashboard.headerBorderLight,
    "--status-online-color": design.dashboard.online.color,
    "--status-online-background": design.dashboard.online.background,
    "--status-online-border": design.dashboard.online.border,
    "--status-offline-color": design.dashboard.offline.color,
    "--status-offline-background": design.dashboard.offline.background,
    "--status-offline-border": design.dashboard.offline.border,
    "--dashboard-avatar-bg": design.dashboard.profile.avatarBackground,
    "--dashboard-avatar-text": design.dashboard.profile.avatarText,
    "--dashboard-overlay": design.dashboard.overlay,
    "--dashboard-library-favorites-color": design.dashboard.libraryFavorites.color,
    "--dashboard-library-favorites-background":
      theme === "dark"
        ? design.dashboard.libraryFavorites.backgroundDark
        : design.dashboard.libraryFavorites.backgroundLight,
    "--dashboard-library-favorites-border": design.dashboard.libraryFavorites.border,
    "--dashboard-library-offline-color": design.dashboard.libraryOffline.color,
    "--dashboard-library-offline-background":
      theme === "dark"
        ? design.dashboard.libraryOffline.backgroundDark
        : design.dashboard.libraryOffline.backgroundLight,
    "--dashboard-library-offline-border": design.dashboard.libraryOffline.border,
    "--dashboard-section-interview-accent": design.dashboard.sections.interview.accent,
    "--dashboard-section-interview-surface":
      theme === "dark"
        ? design.dashboard.sections.interview.surfaceDark
        : design.dashboard.sections.interview.surfaceLight,
    "--dashboard-section-courses-accent": design.dashboard.sections.courses.accent,
    "--dashboard-section-courses-surface":
      theme === "dark"
        ? design.dashboard.sections.courses.surfaceDark
        : design.dashboard.sections.courses.surfaceLight,
    "--dashboard-section-cbt-accent": design.dashboard.sections.cbt.accent,
    "--dashboard-section-cbt-surface":
      theme === "dark"
        ? design.dashboard.sections.cbt.surfaceDark
        : design.dashboard.sections.cbt.surfaceLight,
    "--course-card-bg":
      theme === "dark"
        ? design.courses.cardBackgroundDark
        : design.courses.cardBackgroundLight,
    "--landing-hero-accent": design.landing.heroAccentGradient,
    "--mobile-quick-nav-surface":
      theme === "dark" ? design.mobile.quickNavSurfaceDark : design.mobile.quickNavSurfaceLight,
    "--mobile-quick-nav-border":
      theme === "dark" ? design.mobile.quickNavBorderDark : design.mobile.quickNavBorderLight,
    "--mobile-quick-nav-shadow":
      theme === "dark" ? design.mobile.quickNavShadowDark : design.mobile.quickNavShadowLight,
  };

  Object.entries(design.courses.categoryTones).forEach(([key, tone]) => {
    const varKey = toCssVarKey(key);
    variables[`--course-tone-${varKey}-background`] = tone.background;
    variables[`--course-tone-${varKey}-border`] = tone.border;
    variables[`--course-tone-${varKey}-color`] = tone.color;
  });

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

function SessionLifetimeGuard() {
  const router = useRouter();
  const { status } = useSession();
  const handledRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
    channelRef.current = channel;

    const responder = (event: MessageEvent) => {
      const data = event.data as { type?: string; requestId?: string } | null;
      if (!data || data.type !== "browser-session-check" || !hasBrowserSessionActive()) return;

      channel.postMessage({
        type: "browser-session-active",
        requestId: data.requestId,
      });
    };

    channel.addEventListener("message", responder);

    return () => {
      channel.removeEventListener("message", responder);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const isPublicRoute = PUBLIC_BROWSER_SESSION_ROUTES.has(router.pathname);

    if (status === "unauthenticated") {
      handledRef.current = false;
      clearBrowserSessionActive();
      return;
    }

    if (isPublicRoute) {
      markBrowserSessionActive();
      handledRef.current = false;
      return;
    }

    if (hasBrowserSessionActive()) {
      handledRef.current = false;
      return;
    }

    if (handledRef.current) return;
    handledRef.current = true;

    let cancelled = false;
    const signOutStaleSession = async () => {
      try {
        await signOut({ redirect: false });
      } catch {
        // ignore
      } finally {
        clearBrowserSessionActive();
        if (!cancelled) {
          router.replace(buildPublicEntryUrl(router.asPath, "session-ended"));
        }
      }
    };

    const channel = channelRef.current;
    if (!channel) {
      signOutStaleSession();
      return () => {
        cancelled = true;
      };
    }

    const requestId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const resolveExistingSession = (event: MessageEvent) => {
      const data = event.data as { type?: string; requestId?: string } | null;
      if (!data || data.type !== "browser-session-active" || data.requestId !== requestId) return;

      markBrowserSessionActive();
      handledRef.current = false;
      window.clearTimeout(timeoutId);
      channel.removeEventListener("message", resolveExistingSession);
    };

    channel.addEventListener("message", resolveExistingSession);
    channel.postMessage({ type: "browser-session-check", requestId });

    const timeoutId = window.setTimeout(() => {
      channel.removeEventListener("message", resolveExistingSession);
      if (!hasBrowserSessionActive()) {
        signOutStaleSession();
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      channel.removeEventListener("message", resolveExistingSession);
    };
  }, [router, status]);

  return null;
}

function OfflineWorkspaceController() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const syncStartedRef = useRef(false);
  const initialSyncCompletedRef = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      writeCachedSessionUser(session?.user);
      return;
    }

    if (status === "unauthenticated") {
      clearCachedSessionUser();
    }
  }, [session?.user, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      syncStartedRef.current = false;
      initialSyncCompletedRef.current = false;
      return;
    }

    const isPublicRoute = PUBLIC_BROWSER_SESSION_ROUTES.has(router.pathname);

    if (isPublicRoute) {
      syncStartedRef.current = false;
      return;
    }

    let idleCallbackId: number | null = null;
    let timeoutId: number | null = null;

    const runSync = (force = false) => {
      if (!navigator.onLine || syncStartedRef.current) return;
      if (!force && initialSyncCompletedRef.current) return;
      syncStartedRef.current = true;

      syncOfflineWorkspace(router)
        .then(() => {
          initialSyncCompletedRef.current = true;
        })
        .catch(() => {
          initialSyncCompletedRef.current = false;
        })
        .finally(() => {
          syncStartedRef.current = false;
        });
    };

    const clearScheduledSync = () => {
      if (idleCallbackId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleCallbackId);
        idleCallbackId = null;
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleSync = (force = false) => {
      clearScheduledSync();

      const delay = force ? 1200 : 3500;
      const startSync = () => {
        idleCallbackId = null;
        timeoutId = null;
        runSync(force);
      };

      if (typeof window.requestIdleCallback === "function") {
        idleCallbackId = window.requestIdleCallback(startSync, { timeout: delay });
        return;
      }

      timeoutId = window.setTimeout(startSync, delay);
    };

    scheduleSync();
    const handleOnline = () => scheduleSync(true);
    window.addEventListener("online", handleOnline);

    return () => {
      clearScheduledSync();
      window.removeEventListener("online", handleOnline);
    };
  }, [router, router.pathname, status]);

  return null;
}

function CoreContentWarmupController() {
  const router = useRouter();
  const { status } = useSession();
  const warmedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      warmedRef.current = false;
      return;
    }

    if (PUBLIC_BROWSER_SESSION_ROUTES.has(router.pathname) || !navigator.onLine || warmedRef.current) {
      return;
    }

    warmedRef.current = true;
    void warmCoreContent().catch(() => {
      warmedRef.current = false;
    });
  }, [router.pathname, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const handleOnline = () => {
      if (warmedRef.current) return;
      warmedRef.current = true;
      void warmCoreContent().catch(() => {
        warmedRef.current = false;
      });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [status]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [design, setDesign] = useState<DesignSystem | null>(null);
  const [designError, setDesignError] = useState("");
  const [mounted, setMounted] = useState(false);
  const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== "false";

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    if (design) {
      applyCssVariables(design, theme);
    }
  }, [design, theme, mounted]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchDesignConfig(controller.signal)
      .then((nextDesign) => {
        if (cancelled) return;
        const currentTheme =
          document.documentElement.classList.contains("dark") ? "dark" : "light";
        applyCssVariables(nextDesign, currentTheme);
        setDesign(nextDesign);
        setDesignError("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDesign(null);
        setDesignError(
          error instanceof Error ? error.message : "Failed to load design configuration from GitHub."
        );
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // SW registration unchanged
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const shouldRegister = process.env.NODE_ENV === "production" || enablePwaInDev;

    if (!shouldRegister) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch(console.error);
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, [enablePwaInDev]);

  const themeColor = design?.theme[theme].bg;

  const renderDesignState = () => {
    if (design) {
      return <Component {...pageProps} />;
    }

    if (designError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Design config not available</div>
            <div style={{ marginTop: 10, maxWidth: 620, lineHeight: 1.6 }}>
              Push `design/colour.json`, `design/icon.json`, and `design/course-icons/*` to the
              content repo, then refresh the app.
            </div>
            <div style={{ marginTop: 10, maxWidth: 760, lineHeight: 1.6 }}>{designError}</div>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Loading...</div>
        </div>
      </div>
    );
  };

  return (
    <SessionProvider session={(pageProps as any).session} refetchWhenOffline={false}>
      <SessionLifetimeGuard />
      <CoreContentWarmupController />
      <OfflineWorkspaceController />
      <ThemeContext.Provider
        value={{
          theme,
          toggleTheme: () => setTheme((p) => (p === "light" ? "dark" : "light")),
        }}
      >
        <DesignContext.Provider value={{ design }}>
          <Head>
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <meta
              name="description"
              content="Tinitiate learning PWA for courses, interview preparation, CBT content, favorites, and offline-ready reading."
            />
            {themeColor ? <meta name="theme-color" content={themeColor} /> : null}
          </Head>

          {renderDesignState()}
        </DesignContext.Provider>
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
