type ContentSnapshotEnvelope<T> = {
  savedAt: number;
  data: T;
};

const CONTENT_SNAPSHOT_PREFIX = "tinitiate_content_snapshot_";

const getSnapshotStorageKey = (key: string) =>
  `${CONTENT_SNAPSHOT_PREFIX}${encodeURIComponent(String(key || ""))}`;

export const readContentSnapshot = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getSnapshotStorageKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ContentSnapshotEnvelope<T>;
    return parsed?.data ?? null;
  } catch {
    return null;
  }
};

export const writeContentSnapshot = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;

  try {
    const payload: ContentSnapshotEnvelope<T> = {
      savedAt: Date.now(),
      data,
    };

    window.localStorage.setItem(getSnapshotStorageKey(key), JSON.stringify(payload));
  } catch {
    // Ignore storage quota and serialization failures.
  }
};
