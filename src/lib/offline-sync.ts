import type { NextRouter } from "next/router";

import {
  fetchCbtCollections,
  fetchContentRepoStatus,
  fetchCourseSubjects,
  fetchDesignConfig,
  fetchInterviewQuestion,
  fetchInterviewQuestions,
  fetchMediaItem,
  fetchSlideshow,
  fetchTickerItems,
} from "./content-client";
import { extractMarkdownAssetUrls, fetchTextStrict, toGithubProxyUrl } from "./readme-utils";

const START_URL_CACHE = "start-url";
const APP_PAGES_CACHE = "app-pages";
const REPO_CONTENT_CACHE = "repo-content";
const STATIC_IMAGE_CACHE = "static-image-assets";
const STATIC_AUDIO_CACHE = "static-audio-assets";
const STATIC_VIDEO_CACHE = "static-video-assets";
const OFFLINE_SYNC_STATE_KEY = "tinitiate.offline.sync-state";
export const OFFLINE_SYNC_STATE_EVENT = "tinitiate:offline-sync-state";

type OfflineSyncState = {
  syncedAt: number;
  contentUpdatedAt: string | null;
  contentCommitSha: string | null;
  routeCount: number;
  markdownCount: number;
  detailCount: number;
  status: "ready" | "failed";
  error?: string;
};

let activeSync: Promise<void> | null = null;

const toAbsoluteUrl = (href: string) => new URL(href, window.location.origin).toString();
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown sync error";

const getImageCacheName = (url: string) => {
  if (typeof window === "undefined") return STATIC_IMAGE_CACHE;

  try {
    const absoluteUrl = new URL(toAbsoluteUrl(url));
    if (absoluteUrl.origin === window.location.origin && absoluteUrl.pathname.startsWith("/api/proxy")) {
      return REPO_CONTENT_CACHE;
    }
  } catch {
    // ignore malformed URLs and use the normal image cache
  }

  return STATIC_IMAGE_CACHE;
};

const writeOfflineSyncState = (state: OfflineSyncState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_SYNC_STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_STATE_EVENT, { detail: state }));
};

export const readOfflineSyncState = (): OfflineSyncState | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(OFFLINE_SYNC_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineSyncState;
  } catch {
    return null;
  }
};

const runWithConcurrency = async <T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency = 4
) => {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (typeof item === "undefined") return;
      await worker(item);
    }
  });

  await Promise.all(runners);
};

const cacheRouteHtml = async (href: string) => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const absoluteUrl = toAbsoluteUrl(href);
  const response = await fetch(absoluteUrl, {
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Cache-Control": "no-store",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to cache route ${href} (${response.status})`);
  }

  const cacheName = href === "/" ? START_URL_CACHE : APP_PAGES_CACHE;
  const cache = await caches.open(cacheName);
  await cache.put(absoluteUrl, response.clone());
};

const cacheStaticAsset = async (url: string, cacheName: string) => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const absoluteUrl = toAbsoluteUrl(url);
  const targetUrl = new URL(absoluteUrl);
  const sameOrigin = targetUrl.origin === window.location.origin;

  const response = await fetch(
    absoluteUrl,
    sameOrigin
      ? {
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "Cache-Control": "no-store",
          },
        }
      : {
          cache: "no-store",
          credentials: "omit",
          mode: "no-cors",
        }
  );

  if (!response.ok && response.type !== "opaque") {
    throw new Error(`Failed to cache asset ${absoluteUrl} (${response.status})`);
  }

  const cache = await caches.open(cacheName);
  await cache.put(absoluteUrl, response.clone());
};

const prefetchRoute = async (router: NextRouter | null, href: string) => {
  if (!router?.prefetch) return;

  try {
    await router.prefetch(href);
  } catch {
    // ignore route prefetch failures
  }
};

export async function syncOfflineWorkspace(router?: NextRouter | null) {
  if (activeSync) {
    return activeSync;
  }

  activeSync = (async () => {
    const syncFailures: string[] = [];
    const syncWarnings: string[] = [];
    const rememberFailure = (label: string, error: unknown) => {
      syncFailures.push(`${label}: ${getErrorMessage(error)}`);
    };
    const rememberWarning = (label: string, error: unknown) => {
      syncWarnings.push(`${label}: ${getErrorMessage(error)}`);
    };
    let statusInfo = {
      updatedAt: null as string | null,
      commitSha: null as string | null,
    };

    try {
      const nextStatusInfo = await fetchContentRepoStatus(undefined, { strategy: "network-first" });
      statusInfo = {
        updatedAt: nextStatusInfo.updatedAt,
        commitSha: nextStatusInfo.commitSha,
      };
    } catch (error) {
      rememberWarning("Content repo status", error);
    }

    await fetchTickerItems(undefined, { strategy: "network-first" }).catch((error) => {
      rememberWarning("Ticker", error);
    });

    let design: Awaited<ReturnType<typeof fetchDesignConfig>>;
    let courses: Awaited<ReturnType<typeof fetchCourseSubjects>>;
    let interviewSummaries: Awaited<ReturnType<typeof fetchInterviewQuestions>>;
    let cbtCollections: Awaited<ReturnType<typeof fetchCbtCollections>>;

    try {
      [design, courses, interviewSummaries, cbtCollections] = await Promise.all([
        fetchDesignConfig(undefined, { strategy: "network-first" }),
        fetchCourseSubjects(undefined, { strategy: "network-first" }),
        fetchInterviewQuestions(undefined, { strategy: "network-first" }),
        fetchCbtCollections(undefined, { strategy: "network-first" }),
      ]);
    } catch (error) {
      writeOfflineSyncState({
        syncedAt: Date.now(),
        contentUpdatedAt: statusInfo.updatedAt,
        contentCommitSha: statusInfo.commitSha,
        routeCount: 0,
        markdownCount: 0,
        detailCount: 0,
        status: "failed",
        error:
          syncWarnings.length > 0
            ? `${syncWarnings.slice(0, 5).join(" | ")} | ${getErrorMessage(error)}`
            : getErrorMessage(error),
      });

      throw error;
    }

    const routeHrefs = new Set<string>([
      "/",
      "/login",
      "/signup",
      "/dashboard",
      "/courses",
      "/interview",
      "/cbt",
    ]);
    const markdownUrls = new Set<string>();
    const imageUrls = new Set<string>();
    const audioUrls = new Set<string>();
    const videoUrls = new Set<string>();
    const detailTasks: Array<() => Promise<void>> = [];
    let cachedRouteCount = 0;

    const addImageUrl = (url: string | undefined) => {
      const normalizedUrl = toGithubProxyUrl(String(url || ""));
      if (normalizedUrl) {
        imageUrls.add(normalizedUrl);
      }
    };

    Object.values(design.courseIcons || {}).forEach((entry) => {
      if (entry?.iconUrl) {
        addImageUrl(entry.iconUrl);
      }
    });

    for (const course of courses) {
      const readmeUrl = course.readme_url || "";
      const subjectHref = `/subject/${encodeURIComponent(course.subject)}${
        readmeUrl ? `?readme=${encodeURIComponent(readmeUrl)}` : ""
      }`;

      routeHrefs.add(subjectHref);
      if (course.icon_url) {
        addImageUrl(course.icon_url);
      }

      if (readmeUrl) {
        markdownUrls.add(readmeUrl);
        detailTasks.push(async () => {
          try {
            const readmeMarkdown = await fetchTextStrict(readmeUrl, undefined, {
              strategy: "network-first",
            });
            extractMarkdownAssetUrls(readmeMarkdown, readmeUrl).forEach(addImageUrl);
          } catch (error) {
            rememberFailure(`Subject README ${course.subject}`, error);
          }
        });
      }

      for (const topic of course.topics) {
        if (topic.md_url) {
          markdownUrls.add(topic.md_url);
        }

        routeHrefs.add(
          `/topic/${encodeURIComponent(topic.topic_name)}?subject=${encodeURIComponent(
            course.subject
          )}${readmeUrl ? `&readme=${encodeURIComponent(readmeUrl)}` : ""}`
        );

        detailTasks.push(async () => {
          if (!topic.md_url) return;
          try {
            const topicMarkdown = await fetchTextStrict(topic.md_url, undefined, {
              strategy: "network-first",
            });
            extractMarkdownAssetUrls(topicMarkdown, topic.md_url).forEach(addImageUrl);
          } catch (error) {
            rememberFailure(`Topic markdown ${topic.topic_name}`, error);
          }
        });
      }
    }

    for (const item of interviewSummaries) {
      routeHrefs.add(`/interview/${encodeURIComponent(item.slug)}`);
      detailTasks.push(async () => {
        try {
          const detail = await fetchInterviewQuestion(item.slug, undefined, {
            strategy: "network-first",
          });
          extractMarkdownAssetUrls(detail.markdown, detail.markdown_url).forEach(addImageUrl);
        } catch (error) {
          rememberFailure(`Interview detail ${item.slug}`, error);
        }
      });
    }

    for (const deck of cbtCollections.slideshows) {
      routeHrefs.add(`/cbt/slides/${encodeURIComponent(deck.slug)}`);
      detailTasks.push(async () => {
        try {
          const slideshow = await fetchSlideshow(deck.slug, undefined, {
            strategy: "network-first",
          });
          extractMarkdownAssetUrls(slideshow.markdown, slideshow.markdown_url).forEach(addImageUrl);
        } catch (error) {
          rememberFailure(`Slideshow ${deck.slug}`, error);
        }
      });
    }

    for (const item of cbtCollections.trainingVideos) {
      routeHrefs.add(
        `/cbt/media/${encodeURIComponent(item.slug)}?kind=${encodeURIComponent("training-videos")}`
      );
      detailTasks.push(async () => {
        try {
          const mediaItem = await fetchMediaItem("training-videos", item.slug, undefined, {
            strategy: "network-first",
          });
          if (mediaItem.mediaUrl) {
            videoUrls.add(mediaItem.mediaUrl);
          }
          if (mediaItem.posterUrl) {
            addImageUrl(mediaItem.posterUrl);
          }
          extractMarkdownAssetUrls(mediaItem.notesMarkdown || "", mediaItem.notesMarkdownUrl).forEach(addImageUrl);
        } catch (error) {
          rememberFailure(`Training video ${item.slug}`, error);
        }
      });
    }

    for (const item of cbtCollections.audioBooks) {
      routeHrefs.add(
        `/cbt/media/${encodeURIComponent(item.slug)}?kind=${encodeURIComponent("audio-books")}`
      );
      detailTasks.push(async () => {
        try {
          const mediaItem = await fetchMediaItem("audio-books", item.slug, undefined, {
            strategy: "network-first",
          });
          if (mediaItem.mediaUrl) {
            audioUrls.add(mediaItem.mediaUrl);
          }
          if (mediaItem.posterUrl) {
            addImageUrl(mediaItem.posterUrl);
          }
          extractMarkdownAssetUrls(mediaItem.notesMarkdown || "", mediaItem.notesMarkdownUrl).forEach(addImageUrl);
        } catch (error) {
          rememberFailure(`Audio item ${item.slug}`, error);
        }
      });
    }

    try {
      await runWithConcurrency(detailTasks, async (task) => {
        await task();
      });

      await runWithConcurrency(Array.from(imageUrls), async (url) => {
        try {
          await cacheStaticAsset(url, getImageCacheName(url));
        } catch (error) {
          rememberFailure(`Image asset ${url}`, error);
        }
      });

      await runWithConcurrency(Array.from(audioUrls), async (url) => {
        try {
          await cacheStaticAsset(url, STATIC_AUDIO_CACHE);
        } catch (error) {
          rememberFailure(`Audio asset ${url}`, error);
        }
      });

      await runWithConcurrency(Array.from(videoUrls), async (url) => {
        try {
          await cacheStaticAsset(url, STATIC_VIDEO_CACHE);
        } catch (error) {
          rememberFailure(`Video asset ${url}`, error);
        }
      });

      await runWithConcurrency(Array.from(routeHrefs), async (href) => {
        try {
          await prefetchRoute(router || null, href);
          await cacheRouteHtml(href);
          cachedRouteCount += 1;
        } catch (error) {
          rememberFailure(`Route ${href}`, error);
        }
      });

      if (cachedRouteCount === 0) {
        throw new Error("Could not cache any application routes.");
      }

      if (syncFailures.length > 0) {
        throw new Error(syncFailures.slice(0, 5).join(" | "));
      }

      writeOfflineSyncState({
        syncedAt: Date.now(),
        contentUpdatedAt: statusInfo.updatedAt,
        contentCommitSha: statusInfo.commitSha,
        routeCount: routeHrefs.size,
        markdownCount: markdownUrls.size,
        detailCount: detailTasks.length + imageUrls.size + audioUrls.size + videoUrls.size,
        status: "ready",
        error: syncWarnings.length > 0 ? syncWarnings.slice(0, 5).join(" | ") : undefined,
      });
    } catch (error) {
      const failureMessage =
        syncFailures.length > 0 ? syncFailures.slice(0, 5).join(" | ") : getErrorMessage(error);
      const warningMessage = syncWarnings.length > 0 ? syncWarnings.slice(0, 5).join(" | ") : "";

      writeOfflineSyncState({
        syncedAt: Date.now(),
        contentUpdatedAt: statusInfo.updatedAt,
        contentCommitSha: statusInfo.commitSha,
        routeCount: routeHrefs.size,
        markdownCount: markdownUrls.size,
        detailCount: detailTasks.length + imageUrls.size + audioUrls.size + videoUrls.size,
        status: "failed",
        error: warningMessage ? `${warningMessage} | ${failureMessage}` : failureMessage,
      });

      throw error;
    }
  })().finally(() => {
    activeSync = null;
  });

  return activeSync;
}
