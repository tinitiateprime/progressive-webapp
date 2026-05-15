import { useEffect, useMemo, useState } from "react";

import { CACHE_STORAGE_UPDATED_EVENT, type CacheStorageUpdatedDetail } from "./cache-events";
import { hasCachedContentUrl } from "./content-client";
import type { CbtCollections, CourseSubject, InterviewQuestionSummary } from "./content-types";
import { readCachedRepoText } from "./readme-utils";

export type CacheProgressTarget = {
  key: string;
  kind: "content-json" | "repo-text" | "request";
  url: string;
};

export type CacheSaveProgress = {
  saved: number;
  total: number;
  ready: boolean;
};

const canReadCacheStorage = () =>
  typeof window !== "undefined" && typeof window.caches !== "undefined";

const toAbsoluteRequestUrl = (url: string) => {
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
};

const getUrlMatchValues = (url: string) => {
  if (!url) return [];

  const values = new Set([url]);
  if (typeof window !== "undefined") {
    try {
      values.add(new URL(url, window.location.origin).toString());
    } catch {
      // keep the raw URL only
    }
  }

  return Array.from(values);
};

const hasCachedRequestUrl = async (url: string) => {
  if (!url || !canReadCacheStorage()) return false;

  try {
    const absoluteUrl = toAbsoluteRequestUrl(url);
    const cached =
      (await caches.match(absoluteUrl, { ignoreSearch: false })) ||
      (await caches.match(url, { ignoreSearch: false }));

    return Boolean(cached && (cached.ok || cached.type === "opaque"));
  } catch {
    return false;
  }
};

const hasCachedTarget = async (target: CacheProgressTarget) => {
  if (!target.url) return false;

  if (target.kind === "repo-text") {
    return Boolean(await readCachedRepoText(target.url));
  }

  if (target.kind === "content-json") {
    return hasCachedContentUrl(target.url);
  }

  return hasCachedRequestUrl(target.url);
};

const readCachedTargetKeys = async (targets: CacheProgressTarget[]) => {
  const savedEntries = await Promise.all(
    targets.map(async (target) => ({
      key: target.key,
      saved: await hasCachedTarget(target),
    }))
  );

  return new Set(savedEntries.filter((entry) => entry.saved).map((entry) => entry.key));
};

export const formatCacheSaveProgressLabel = (progress: CacheSaveProgress) => {
  if (progress.total === 0) return "0/0 saved";
  if (progress.ready && progress.saved >= progress.total) {
    return `${progress.saved}/${progress.total} done`;
  }

  return `${progress.saved}/${progress.total} saved`;
};

export const useCacheSaveProgress = (targets: CacheProgressTarget[]) => {
  const [progress, setProgress] = useState<CacheSaveProgress>({
    saved: 0,
    total: targets.length,
    ready: false,
  });

  const targetKey = useMemo(
    () => targets.map((target) => `${target.kind}:${target.key}:${target.url}`).join("|"),
    [targets]
  );

  useEffect(() => {
    const currentTargets = [...targets];
    const targetKeysByUrl = new Map<string, Set<string>>();
    const savedKeysRef = { current: new Set<string>() };
    let cancelled = false;
    let frameId: number | null = null;

    const addTargetUrl = (url: string, key: string) => {
      for (const value of getUrlMatchValues(url)) {
        const existingKeys = targetKeysByUrl.get(value) || new Set<string>();
        existingKeys.add(key);
        targetKeysByUrl.set(value, existingKeys);
      }
    };

    for (const target of currentTargets) {
      addTargetUrl(target.url, target.key);
    }

    const writeProgress = (savedKeys: Set<string>, ready = true) => {
      setProgress({
        saved: savedKeys.size,
        total: currentTargets.length,
        ready,
      });
    };

    const refresh = async () => {
      const savedKeys = await readCachedTargetKeys(currentTargets);
      if (cancelled) return;

      const mergedSavedKeys = new Set([...savedKeysRef.current, ...savedKeys]);
      savedKeysRef.current = mergedSavedKeys;
      writeProgress(mergedSavedKeys);
    };

    const scheduleRefresh = () => {
      if (typeof window === "undefined") return;

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        void refresh();
      });
    };

    const markUrlSaved = (url: string) => {
      const keys = targetKeysByUrl.get(url);
      if (!keys?.size) return false;

      const nextSavedKeys = new Set(savedKeysRef.current);
      keys.forEach((key) => nextSavedKeys.add(key));
      savedKeysRef.current = nextSavedKeys;
      writeProgress(nextSavedKeys);
      return true;
    };

    const handleCacheUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CacheStorageUpdatedDetail>).detail;
      const updatedUrl = detail?.url || "";
      const matched = getUrlMatchValues(updatedUrl).some(markUrlSaved);

      if (!matched) {
        scheduleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleRefresh();
      }
    };

    setProgress((previous) => ({
      saved: Math.min(previous.saved, currentTargets.length),
      total: currentTargets.length,
      ready: false,
    }));

    void refresh();

    if (typeof window !== "undefined") {
      window.addEventListener(CACHE_STORAGE_UPDATED_EVENT, handleCacheUpdated);
      window.addEventListener("focus", scheduleRefresh);
      window.addEventListener("online", scheduleRefresh);
      window.addEventListener("storage", scheduleRefresh);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;

      if (frameId !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(frameId);
      }

      if (typeof window !== "undefined") {
        window.removeEventListener(CACHE_STORAGE_UPDATED_EVENT, handleCacheUpdated);
        window.removeEventListener("focus", scheduleRefresh);
        window.removeEventListener("online", scheduleRefresh);
        window.removeEventListener("storage", scheduleRefresh);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [targetKey, targets]);

  return progress;
};

export const buildCourseCacheTargets = (courses: CourseSubject[]): CacheProgressTarget[] =>
  courses.map((course) => ({
    key: course.slug || course.subject,
    kind: "repo-text",
    url: course.readme_url,
  }));

export const buildInterviewCacheTargets = (
  items: InterviewQuestionSummary[]
): CacheProgressTarget[] =>
  items.map((item) => ({
    key: item.slug,
    kind: "content-json",
    url: `/api/content/interview/${encodeURIComponent(item.slug)}`,
  }));

export const buildCbtCacheTargets = (collections: CbtCollections | null): CacheProgressTarget[] => {
  if (!collections) return [];

  return [
    ...collections.slideshows.map((deck) => ({
      key: `slideshow:${deck.slug}`,
      kind: "content-json" as const,
      url: `/api/content/slideshows/${encodeURIComponent(deck.slug)}`,
    })),
    ...collections.trainingVideos.map((item) => ({
      key: `training-video:${item.slug}`,
      kind: "content-json" as const,
      url: `/api/content/media/training-videos/${encodeURIComponent(item.slug)}`,
    })),
    ...collections.audioBooks.map((item) => ({
      key: `audio-book:${item.slug}`,
      kind: "content-json" as const,
      url: `/api/content/media/audio-books/${encodeURIComponent(item.slug)}`,
    })),
  ];
};
