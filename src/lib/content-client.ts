import type {
  CbtCollections,
  CourseSubject,
  DesignSystem,
  InterviewQuestionDetail,
  InterviewQuestionSummary,
  MediaCollectionItem,
  SlideshowDeck,
  SlideshowSummary,
  TickerItem,
} from "./content-types";

import { readContentSnapshot, writeContentSnapshot } from "./content-snapshot";
import { normalize } from "./readme-utils";

class HttpStatusError extends Error {}

const fetchJsonNoStore = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
      signal,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new HttpStatusError(message || `Failed to fetch ${url} (${response.status})`);
    }

    const data = (await response.json()) as T;
    writeContentSnapshot(url, data);
    return data;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError") && !(error instanceof HttpStatusError)) {
      const snapshot = readContentSnapshot<T>(url);
      if (snapshot !== null) {
        return snapshot;
      }
    }

    throw error;
  }
};

export const fetchTickerItems = async (signal?: AbortSignal): Promise<TickerItem[]> => {
  return fetchJsonNoStore<TickerItem[]>("/api/content/ticker", signal);
};

export const fetchDesignConfig = async (signal?: AbortSignal): Promise<DesignSystem> =>
  fetchJsonNoStore<DesignSystem>("/api/content/design", signal);

export const fetchCourseSubjects = async (signal?: AbortSignal): Promise<CourseSubject[]> =>
  fetchJsonNoStore<CourseSubject[]>("/api/content/courses", signal);

export const resolveCourseSubject = async (subjectName: string, signal?: AbortSignal) => {
  const subjects = await fetchCourseSubjects(signal);
  return (
    subjects.find(
      (subject) =>
        subject.slug === subjectName || normalize(subject.subject) === normalize(subjectName)
    ) || null
  );
};

export const fetchInterviewQuestions = async (
  signal?: AbortSignal
): Promise<InterviewQuestionSummary[]> =>
  fetchJsonNoStore<InterviewQuestionSummary[]>("/api/content/interview", signal);

export const fetchInterviewQuestion = async (
  slug: string,
  signal?: AbortSignal
): Promise<InterviewQuestionDetail> =>
  fetchJsonNoStore<InterviewQuestionDetail>(
    `/api/content/interview/${encodeURIComponent(slug)}`,
    signal
  );

export const fetchCbtCollections = async (signal?: AbortSignal): Promise<CbtCollections> =>
  fetchJsonNoStore<CbtCollections>("/api/content/cbt", signal);

export const fetchSlideshows = async (signal?: AbortSignal): Promise<SlideshowSummary[]> => {
  const collections = await fetchCbtCollections(signal);
  return collections.slideshows;
};

export const fetchSlideshow = async (
  slug: string,
  signal?: AbortSignal
): Promise<SlideshowDeck> =>
  fetchJsonNoStore<SlideshowDeck>(
    `/api/content/slideshows/${encodeURIComponent(slug)}`,
    signal
  );

export const fetchMediaItem = async (
  kind: "training-videos" | "audio-books",
  slug: string,
  signal?: AbortSignal
): Promise<MediaCollectionItem> =>
  fetchJsonNoStore<MediaCollectionItem>(
    `/api/content/media/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`,
    signal
  );
