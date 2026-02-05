import { CATALOG_URL } from "../config/catalogSource";

const CACHE_PREFIX = "tinitiate_catalog_cache_v1";
const MD_CACHE_PREFIX = "tinitiate_md_cache_v1";

/**
 * Basic localStorage cache with TTL
 */
function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function setCache(key, data, ttlMs) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, expiresAt: Date.now() + ttlMs })
    );
  } catch {
    // ignore storage errors
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch JSON (${res.status}) from ${url}`);
  }
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch markdown (${res.status}) from ${url}`);
  }
  return res.text();
}

export async function fetchCatalog() {
  const cacheKey = `${CACHE_PREFIX}:${CATALOG_URL}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await fetchJson(CATALOG_URL);

  // cache for 30 minutes
  setCache(cacheKey, data, 30 * 60 * 1000);
  return data;
}

export async function fetchMarkdown(mdUrl) {
  const cacheKey = `${MD_CACHE_PREFIX}:${mdUrl}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const text = await fetchText(mdUrl);

  // cache for 60 minutes
  setCache(cacheKey, text, 60 * 60 * 1000);
  return text;
}
