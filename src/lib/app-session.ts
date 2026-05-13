import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

import { clearBrowserSessionActive, hasBrowserSessionActive } from "./browserSession";

const CACHED_SESSION_USER_KEY = "tinitiate.auth.cached-user";

type CachedSessionUser = NonNullable<Session["user"]> & {
  id?: string;
};

const normalizeCachedUser = (value: unknown): CachedSessionUser | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : null;
  const email = typeof record.email === "string" ? record.email : null;
  const image = typeof record.image === "string" ? record.image : null;
  const id = typeof record.id === "string" ? record.id : undefined;

  if (!name && !email && !id) return null;

  return {
    name,
    email,
    image,
    id,
  };
};

export const readCachedSessionUser = (): CachedSessionUser | null => {
  if (typeof window === "undefined") return null;

  try {
    return normalizeCachedUser(JSON.parse(localStorage.getItem(CACHED_SESSION_USER_KEY) || "null"));
  } catch {
    return null;
  }
};

export const writeCachedSessionUser = (user?: Session["user"] & { id?: string }) => {
  if (typeof window === "undefined") return;

  const normalized = normalizeCachedUser(user || null);
  if (!normalized) return;

  localStorage.setItem(CACHED_SESSION_USER_KEY, JSON.stringify(normalized));
};

export const clearCachedSessionUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHED_SESSION_USER_KEY);
};

export const clearLegacyOfflineLibraryData = () => {
  if (typeof window === "undefined") return;

  const keysToDelete = Object.keys(localStorage).filter(
    (key) =>
      key === "favorite_topics" ||
      key === "tinitiate_library_active_user" ||
      key.startsWith("favorite_topics_") ||
      key.startsWith("offline_subject_")
  );

  for (const key of keysToDelete) {
    localStorage.removeItem(key);
  }
};

export function useAppSession() {
  const session = useSession();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const update = () => setIsOffline(typeof navigator !== "undefined" && !navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const cachedUser = readCachedSessionUser();

  if (session.status === "authenticated") {
    return {
      ...session,
      offlineFallback: false,
    };
  }

  if (isOffline && hasBrowserSessionActive() && cachedUser) {
    return {
      data: { user: cachedUser } as Session,
      status: "authenticated" as const,
      update: session.update,
      offlineFallback: true,
    };
  }

  return {
    ...session,
    offlineFallback: false,
  };
}

export const resetOfflineSessionState = () => {
  clearBrowserSessionActive();
  clearCachedSessionUser();
};
