import Head from "next/head";
import type { AppProps } from "next/app";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { ThemeContext, Theme } from "../context/ThemeContext";
import {
  clearBrowserSessionActive,
  hasBrowserSessionActive,
  markBrowserSessionActive,
} from "../lib/browserSession";

const AUTH_SESSION_CHANNEL = "tinitiate.auth.browser-session";

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

    if (status === "unauthenticated") {
      handledRef.current = false;
      clearBrowserSessionActive();
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
          router.replace("/login?reason=session-ended");
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

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

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
  }, [theme, mounted]);

  // SW registration unchanged
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch(console.error);
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  return (
    <SessionProvider session={(pageProps as any).session}>
      <SessionLifetimeGuard />
      <ThemeContext.Provider
        value={{
          theme,
          toggleTheme: () => setTheme((p) => (p === "light" ? "dark" : "light")),
        }}
      >
        <Head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
        </Head>

        <Component {...pageProps} />
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
