import {
  ACTIVE_LIBRARY_USER_KEY,
  normalizeLibraryUserKey,
  readAllOfflineSubjectMetas,
  setActiveLibraryUserKey,
  writeOfflineSubjectMeta,
  type OfflineSubjectMeta,
} from "./offline";

export type SavedFavoriteTopic = {
  slug: string;
  topic_name: string;
  subject: string;
  md_url?: string;
  subject_readme_url?: string;
  savedAt: number;
};

const FAVORITES_STORAGE_PREFIX = "favorite_topics_";
const FAVORITES_STORAGE_FALLBACK = "favorite_topics";

const normalizeFavoriteTopic = (value: unknown): SavedFavoriteTopic | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const slug = String(record.slug || "").trim();
  const topic_name = String(record.topic_name || "").trim();
  const subject = String(record.subject || "").trim();
  const savedAt = Number(record.savedAt);

  if (!slug || !topic_name || !subject) return null;

  return {
    slug,
    topic_name,
    subject,
    md_url: typeof record.md_url === "string" ? record.md_url : undefined,
    subject_readme_url:
      typeof record.subject_readme_url === "string" ? record.subject_readme_url : undefined,
    savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
  };
};

const resolveLibraryUserKey = (accountKey?: string) => {
  const normalized = normalizeLibraryUserKey(accountKey);
  if (normalized) return normalized;

  if (typeof window === "undefined") return "";
  return normalizeLibraryUserKey(localStorage.getItem(ACTIVE_LIBRARY_USER_KEY));
};

const getFavoritesStorageKey = (accountKey?: string) => {
  const scope = resolveLibraryUserKey(accountKey);
  return scope ? `${FAVORITES_STORAGE_PREFIX}${scope}` : FAVORITES_STORAGE_FALLBACK;
};

const sortFavorites = (topics: SavedFavoriteTopic[]) =>
  [...topics].sort((a, b) => {
    if (b.savedAt !== a.savedAt) return b.savedAt - a.savedAt;
    return a.topic_name.localeCompare(b.topic_name);
  });

export const getLibraryUserKey = (
  user?: { id?: string | null; email?: string | null } | null
) => normalizeLibraryUserKey(user?.id || user?.email || "");

export const mergeFavoriteTopics = (...lists: Array<SavedFavoriteTopic[] | undefined>) => {
  const bySlug = new Map<string, SavedFavoriteTopic>();

  for (const list of lists) {
    for (const item of list || []) {
      const normalized = normalizeFavoriteTopic(item);
      if (!normalized) continue;

      const existing = bySlug.get(normalized.slug);
      if (!existing) {
        bySlug.set(normalized.slug, normalized);
        continue;
      }

      bySlug.set(normalized.slug, {
        ...existing,
        ...normalized,
        md_url: normalized.md_url || existing.md_url,
        subject_readme_url: normalized.subject_readme_url || existing.subject_readme_url,
        savedAt: Math.max(existing.savedAt || 0, normalized.savedAt || 0),
      });
    }
  }

  return sortFavorites(Array.from(bySlug.values()));
};

export const readFavoriteTopics = (accountKey?: string): SavedFavoriteTopic[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getFavoritesStorageKey(accountKey));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return sortFavorites(
      parsed
        .map((item) => normalizeFavoriteTopic(item))
        .filter((item): item is SavedFavoriteTopic => Boolean(item))
    );
  } catch {
    return [];
  }
};

export const writeFavoriteTopics = (topics: SavedFavoriteTopic[], accountKey?: string) => {
  if (typeof window === "undefined") return [];

  const normalized = sortFavorites(
    topics
      .map((item) => normalizeFavoriteTopic(item))
      .filter((item): item is SavedFavoriteTopic => Boolean(item))
  );

  localStorage.setItem(getFavoritesStorageKey(accountKey), JSON.stringify(normalized));
  return normalized;
};

export const upsertFavoriteTopic = (topic: SavedFavoriteTopic, accountKey?: string) =>
  writeFavoriteTopics(mergeFavoriteTopics([topic], readFavoriteTopics(accountKey)), accountKey);

export const removeFavoriteTopic = (slug: string, accountKey?: string) =>
  writeFavoriteTopics(
    readFavoriteTopics(accountKey).filter((item) => item.slug !== slug),
    accountKey
  );

export const mergeOfflineSubjectMetas = (...lists: Array<OfflineSubjectMeta[] | undefined>) => {
  const bySubject = new Map<string, OfflineSubjectMeta>();

  for (const list of lists) {
    for (const meta of list || []) {
      if (!meta?.subject) continue;

      const key = meta.subject.trim().toLowerCase();
      const existing = bySubject.get(key);
      if (!existing || meta.savedAt >= existing.savedAt) {
        bySubject.set(key, {
          ...existing,
          ...meta,
          topicCount: meta.topicCount || meta.topics.length,
          subject_readme_url: meta.subject_readme_url || existing?.subject_readme_url,
        });
      }
    }
  }

  return Array.from(bySubject.values()).sort((a, b) => a.subject.localeCompare(b.subject));
};

export const hydrateOfflineSubjectsForAccount = (
  serverMetas: OfflineSubjectMeta[],
  accountKey?: string
) => {
  const merged = mergeOfflineSubjectMetas(readAllOfflineSubjectMetas(accountKey), serverMetas);

  for (const meta of merged) {
    writeOfflineSubjectMeta(meta, accountKey);
  }

  return merged;
};

export { setActiveLibraryUserKey };
