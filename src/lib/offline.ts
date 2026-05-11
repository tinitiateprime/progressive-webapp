import { toRawGithub } from "./readme-utils";

export type OfflineTopic = {
  topic_name: string;
  md_url: string;
  bullets?: string[];
  section_markdown?: string;
};

export type OfflineSubjectMeta = {
  subject: string;
  savedAt: number;
  topicCount: number;
  topics: OfflineTopic[];
  subject_readme_url?: string;
};

export type OfflineSubjectSummary = {
  subject: string;
  savedAt: number;
  topicCount: number;
};

export const CACHE_NAME = "tinitiate-offline-v1";
export const OFFLINE_PREFIX = "offline_subject_";
export const ACTIVE_LIBRARY_USER_KEY = "tinitiate_library_active_user";

const ACCOUNT_SEPARATOR = "__";

export const normalizeOfflineKey = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const normalizeLibraryUserKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeTopic = (value: unknown): OfflineTopic | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const topic_name = String(record.topic_name || "").trim();
  const md_url = String(record.md_url || "").trim();

  if (!topic_name || !md_url) return null;

  return {
    topic_name,
    md_url,
    bullets: Array.isArray(record.bullets)
      ? record.bullets.filter((bullet): bullet is string => typeof bullet === "string")
      : undefined,
    section_markdown:
      typeof record.section_markdown === "string" ? record.section_markdown : undefined,
  };
};

const parseOfflineSubjectMeta = (raw: string | null): OfflineSubjectMeta | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const subject = String(parsed.subject || "").trim();
    const savedAt = Number(parsed.savedAt);
    const topics = Array.isArray(parsed.topics)
      ? parsed.topics
          .map((topic) => normalizeTopic(topic))
          .filter((topic): topic is OfflineTopic => Boolean(topic))
      : [];

    if (!subject || !Number.isFinite(savedAt)) return null;

    return {
      subject,
      savedAt,
      topicCount:
        typeof parsed.topicCount === "number" && Number.isFinite(parsed.topicCount)
          ? parsed.topicCount
          : topics.length,
      topics,
      subject_readme_url:
        typeof parsed.subject_readme_url === "string" ? parsed.subject_readme_url : undefined,
    };
  } catch {
    return null;
  }
};

const readActiveLibraryUserKey = () => {
  if (typeof window === "undefined") return "";
  return normalizeLibraryUserKey(localStorage.getItem(ACTIVE_LIBRARY_USER_KEY));
};

const resolveLibraryUserKey = (accountKey?: string) => {
  const normalized = normalizeLibraryUserKey(accountKey);
  return normalized || readActiveLibraryUserKey();
};

const isScopedOfflineKey = (key: string) =>
  key.startsWith(OFFLINE_PREFIX) && key.slice(OFFLINE_PREFIX.length).includes(ACCOUNT_SEPARATOR);

const getLegacyOfflineSubjectStorageKey = (subject: string) =>
  `${OFFLINE_PREFIX}${normalizeOfflineKey(subject)}`;

const getScopedOfflinePrefix = (accountKey?: string) => {
  const scope = resolveLibraryUserKey(accountKey);
  return scope ? `${OFFLINE_PREFIX}${scope}${ACCOUNT_SEPARATOR}` : OFFLINE_PREFIX;
};

const listLegacyOfflineKeys = () => {
  if (typeof window === "undefined") return [];
  return Object.keys(localStorage).filter(
    (key) => key.startsWith(OFFLINE_PREFIX) && !isScopedOfflineKey(key)
  );
};

const listOfflineStorageKeys = (accountKey?: string) => {
  if (typeof window === "undefined") return [];

  const scope = resolveLibraryUserKey(accountKey);
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(OFFLINE_PREFIX));

  if (!scope) {
    return keys.filter((key) => !isScopedOfflineKey(key));
  }

  const scopedPrefix = getScopedOfflinePrefix(scope);
  const scopedKeys = keys.filter((key) => key.startsWith(scopedPrefix));

  return scopedKeys.length > 0 ? scopedKeys : keys.filter((key) => !isScopedOfflineKey(key));
};

export const setActiveLibraryUserKey = (accountKey?: string) => {
  if (typeof window === "undefined") return;

  const normalized = normalizeLibraryUserKey(accountKey);
  if (!normalized) return;

  localStorage.setItem(ACTIVE_LIBRARY_USER_KEY, normalized);
};

export const getOfflineSubjectStorageKey = (subject: string, accountKey?: string) => {
  const normalizedSubject = normalizeOfflineKey(subject);
  const scope = resolveLibraryUserKey(accountKey);

  if (!scope) {
    return getLegacyOfflineSubjectStorageKey(normalizedSubject);
  }

  return `${OFFLINE_PREFIX}${scope}${ACCOUNT_SEPARATOR}${normalizedSubject}`;
};

export const migrateLegacyOfflineSubjects = (accountKey?: string) => {
  if (typeof window === "undefined") return [] as OfflineSubjectMeta[];

  const scope = normalizeLibraryUserKey(accountKey);
  if (!scope) return [] as OfflineSubjectMeta[];

  const migrated: OfflineSubjectMeta[] = [];

  for (const key of listLegacyOfflineKeys()) {
    const meta = parseOfflineSubjectMeta(localStorage.getItem(key));
    if (!meta) continue;

    const scopedKey = getOfflineSubjectStorageKey(meta.subject, scope);
    if (!localStorage.getItem(scopedKey)) {
      localStorage.setItem(scopedKey, JSON.stringify(meta));
      migrated.push(meta);
    }

    localStorage.removeItem(key);
  }

  return migrated;
};

export const readOfflineSubjectMeta = (subject: string, accountKey?: string) => {
  if (typeof window === "undefined") return null;

  const scopedKey = getOfflineSubjectStorageKey(subject, accountKey);
  const scopedMeta = parseOfflineSubjectMeta(localStorage.getItem(scopedKey));
  if (scopedMeta) return scopedMeta;

  const legacyKey = getLegacyOfflineSubjectStorageKey(subject);
  const legacyMeta = parseOfflineSubjectMeta(localStorage.getItem(legacyKey));

  if (legacyMeta && resolveLibraryUserKey(accountKey)) {
    localStorage.setItem(scopedKey, JSON.stringify(legacyMeta));
    localStorage.removeItem(legacyKey);
  }

  return legacyMeta;
};

export const readOfflineSubjectMetaByKey = (key: string) => {
  if (typeof window === "undefined") return null;
  return parseOfflineSubjectMeta(localStorage.getItem(key));
};

export const readAllOfflineSubjectMetas = (accountKey?: string): OfflineSubjectMeta[] => {
  if (typeof window === "undefined") return [];

  const bySubject = new Map<string, OfflineSubjectMeta>();

  for (const key of listOfflineStorageKeys(accountKey)) {
    const meta = parseOfflineSubjectMeta(localStorage.getItem(key));
    if (!meta) continue;

    const normalizedSubject = normalizeOfflineKey(meta.subject);
    const existing = bySubject.get(normalizedSubject);

    if (!existing || meta.savedAt >= existing.savedAt) {
      bySubject.set(normalizedSubject, meta);
    }
  }

  return Array.from(bySubject.values()).sort((a, b) => a.subject.localeCompare(b.subject));
};

export const readOfflineSubjectSummaries = (accountKey?: string): OfflineSubjectSummary[] =>
  readAllOfflineSubjectMetas(accountKey).map((meta) => ({
    subject: meta.subject,
    savedAt: meta.savedAt,
    topicCount: meta.topicCount || meta.topics.length,
  }));

export const writeOfflineSubjectMeta = (meta: OfflineSubjectMeta, accountKey?: string) => {
  if (typeof window === "undefined") return;

  const normalizedMeta: OfflineSubjectMeta = {
    ...meta,
    topicCount: meta.topicCount || meta.topics.length,
  };

  localStorage.setItem(
    getOfflineSubjectStorageKey(normalizedMeta.subject, accountKey),
    JSON.stringify(normalizedMeta)
  );
};

export const getOfflineSubjectCacheUrls = (
  meta: Pick<OfflineSubjectMeta, "topics" | "subject_readme_url">
) => {
  const urls = new Set<string>();

  if (meta.subject_readme_url) {
    urls.add(toRawGithub(meta.subject_readme_url));
  }

  for (const topic of meta.topics) {
    if (topic.md_url) {
      urls.add(toRawGithub(topic.md_url));
    }
  }

  return Array.from(urls);
};

export async function cacheTextUrls(
  urls: string[],
  fetcher: (url: string) => Promise<string>,
  onProgress?: (done: number, total: number) => void
) {
  if (typeof window === "undefined" || !("caches" in window)) {
    throw new Error("Cache Storage is not supported in this browser.");
  }

  const uniqueUrls = Array.from(new Set(urls.filter(Boolean).map((url) => toRawGithub(url))));
  const cache = await caches.open(CACHE_NAME);
  const savedUrls: string[] = [];
  const failedUrls: Array<{ url: string; message: string }> = [];

  for (let index = 0; index < uniqueUrls.length; index++) {
    const url = uniqueUrls[index];

    try {
      const existing = await cache.match(url);
      if (existing) {
        savedUrls.push(url);
        continue;
      }

      const text = await fetcher(url);
      await cache.put(
        url,
        new Response(text, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
      savedUrls.push(url);
    } catch (error) {
      failedUrls.push({
        url,
        message: error instanceof Error ? error.message : "Unknown cache failure",
      });
    } finally {
      onProgress?.(index + 1, uniqueUrls.length);
    }
  }

  return {
    savedUrls,
    failedUrls,
    totalUrls: uniqueUrls.length,
  };
}

export async function removeOfflineSubject(subject: string, accountKey?: string) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(getOfflineSubjectStorageKey(subject, accountKey));
  localStorage.removeItem(getLegacyOfflineSubjectStorageKey(subject));
}
