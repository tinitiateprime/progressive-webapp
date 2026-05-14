/* eslint-disable @next/next/no-img-element */
"use client";

import type { ImgHTMLAttributes } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { toGithubProxyUrl } from "../../lib/readme-utils";

const IMAGE_CACHE_NAMES = ["repo-content", "static-image-assets"];

const canReadCacheStorage = () =>
  typeof window !== "undefined" && typeof window.caches !== "undefined";

const toAbsoluteUrl = (url: string) => {
  if (typeof window === "undefined") return url;

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
};

const buildCacheKeys = (url: string) => {
  const keys = new Set<string>();
  const absoluteUrl = toAbsoluteUrl(url);

  if (url) keys.add(url);
  if (absoluteUrl) keys.add(absoluteUrl);

  return Array.from(keys);
};

const readCachedImageBlobUrl = async (url: string) => {
  if (!url || !canReadCacheStorage()) return "";

  const keys = buildCacheKeys(url);

  for (const cacheName of IMAGE_CACHE_NAMES) {
    const cache = await caches.open(cacheName);

    for (const key of keys) {
      const cached = await cache.match(key, { ignoreSearch: false });
      const contentType = cached?.headers.get("content-type") || "";

      if (!cached?.ok || !contentType.toLowerCase().startsWith("image/")) {
        continue;
      }

      const blob = await cached.clone().blob();
      if (blob.size > 0) {
        return URL.createObjectURL(blob);
      }
    }
  }

  return "";
};

type CachedRepoImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string;
};

export default function CachedRepoImage({ src = "", alt = "", onError, ...props }: CachedRepoImageProps) {
  const normalizedSrc = useMemo(() => toGithubProxyUrl(String(src || "")), [src]);
  const [displaySrc, setDisplaySrc] = useState(normalizedSrc);
  const objectUrlRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    const clearObjectUrl = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };

    const loadCachedImage = async () => {
      try {
        const blobUrl = await readCachedImageBlobUrl(normalizedSrc);
        if (cancelled || !blobUrl) return;

        clearObjectUrl();
        objectUrlRef.current = blobUrl;
        setDisplaySrc(blobUrl);
      } catch {
        // Keep the normal URL so the service worker can still serve it.
      }
    };

    clearObjectUrl();
    setDisplaySrc(normalizedSrc);

    void loadCachedImage();

    const handleOffline = () => {
      void loadCachedImage();
    };

    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("offline", handleOffline);
      clearObjectUrl();
    };
  }, [normalizedSrc]);

  const handleError: ImgHTMLAttributes<HTMLImageElement>["onError"] = (event) => {
    if (displaySrc !== objectUrlRef.current) {
      void readCachedImageBlobUrl(normalizedSrc).then((blobUrl) => {
        if (!blobUrl) return;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        objectUrlRef.current = blobUrl;
        setDisplaySrc(blobUrl);
      });
    }

    onError?.(event);
  };

  if (!displaySrc) return null;

  return <img {...props} src={displaySrc} alt={alt} onError={handleError} />;
}
