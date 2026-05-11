import { promises as fs } from "fs";
import path from "path";

import { normalizeOfflineKey, type OfflineSubjectMeta, type OfflineTopic } from "./offline";

type OfflineSubjectsFile = {
  byUser: Record<string, OfflineSubjectMeta[]>;
};

const OFFLINE_SUBJECTS_FILE = path.join(process.cwd(), "data", "offline-subjects.json");

let writeQueue = Promise.resolve();

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

const normalizeOfflineSubject = (value: unknown): OfflineSubjectMeta | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const subject = String(record.subject || "").trim();
  const savedAt = Number(record.savedAt);
  const topics = Array.isArray(record.topics)
    ? record.topics
        .map((topic) => normalizeTopic(topic))
        .filter((topic): topic is OfflineTopic => Boolean(topic))
    : [];

  if (!subject || !Number.isFinite(savedAt)) return null;

  return {
    subject,
    savedAt,
    topicCount:
      typeof record.topicCount === "number" && Number.isFinite(record.topicCount)
        ? record.topicCount
        : topics.length,
    topics,
    subject_readme_url:
      typeof record.subject_readme_url === "string" ? record.subject_readme_url : undefined,
  };
};

async function ensureOfflineSubjectsFile() {
  await fs.mkdir(path.dirname(OFFLINE_SUBJECTS_FILE), { recursive: true });

  try {
    await fs.access(OFFLINE_SUBJECTS_FILE);
  } catch {
    await fs.writeFile(
      OFFLINE_SUBJECTS_FILE,
      JSON.stringify({ byUser: {} }, null, 2),
      "utf8"
    );
  }
}

async function readOfflineSubjectsFile(): Promise<OfflineSubjectsFile> {
  await ensureOfflineSubjectsFile();

  try {
    const raw = await fs.readFile(OFFLINE_SUBJECTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as { byUser?: Record<string, unknown[]> };

    const byUser = Object.fromEntries(
      Object.entries(parsed?.byUser || {}).map(([userKey, metas]) => [
        userKey,
        Array.isArray(metas)
          ? metas
              .map((meta) => normalizeOfflineSubject(meta))
              .filter((meta): meta is OfflineSubjectMeta => Boolean(meta))
          : [],
      ])
    );

    return { byUser };
  } catch {
    return { byUser: {} };
  }
}

async function writeOfflineSubjectsFile(data: OfflineSubjectsFile) {
  await ensureOfflineSubjectsFile();
  await fs.writeFile(OFFLINE_SUBJECTS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function queueWrite<T>(task: () => Promise<T>) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

const sortMetas = (metas: OfflineSubjectMeta[]) =>
  [...metas].sort((a, b) => {
    if (b.savedAt !== a.savedAt) return b.savedAt - a.savedAt;
    return a.subject.localeCompare(b.subject);
  });

export async function getOfflineSubjects(userKey: string) {
  const store = await readOfflineSubjectsFile();
  return sortMetas(store.byUser[userKey] || []);
}

export async function upsertOfflineSubject(userKey: string, meta: OfflineSubjectMeta) {
  return queueWrite(async () => {
    const store = await readOfflineSubjectsFile();
    const normalizedMeta = normalizeOfflineSubject(meta);
    if (!normalizedMeta) {
      return sortMetas(store.byUser[userKey] || []);
    }

    const current = store.byUser[userKey] || [];
    const next = [
      normalizedMeta,
      ...current.filter(
        (entry) => normalizeOfflineKey(entry.subject) !== normalizeOfflineKey(normalizedMeta.subject)
      ),
    ];

    store.byUser[userKey] = sortMetas(next);
    await writeOfflineSubjectsFile(store);

    return store.byUser[userKey];
  });
}

export async function removeOfflineSubjectForUser(userKey: string, subject: string) {
  return queueWrite(async () => {
    const store = await readOfflineSubjectsFile();
    const current = store.byUser[userKey] || [];
    const next = current.filter(
      (entry) => normalizeOfflineKey(entry.subject) !== normalizeOfflineKey(subject)
    );

    store.byUser[userKey] = sortMetas(next);
    await writeOfflineSubjectsFile(store);

    return store.byUser[userKey];
  });
}
