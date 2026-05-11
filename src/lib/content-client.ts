import { normalize } from "./readme-utils";
import type {
  CbtCollections,
  CourseSubject,
  InterviewQuestionDetail,
  InterviewQuestionSummary,
  MediaCollectionItem,
  SlideshowDeck,
  TickerItem,
} from "./content-types";

export async function fetchJsonNoStore<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const fetchTickerItems = (signal?: AbortSignal) =>
  fetchJsonNoStore<TickerItem[]>("/api/content/ticker", signal);

export const fetchCourseSubjects = (signal?: AbortSignal) =>
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

export const fetchInterviewQuestions = (signal?: AbortSignal) =>
  fetchJsonNoStore<InterviewQuestionSummary[]>("/api/content/interview", signal);

export const fetchInterviewQuestion = (slug: string, signal?: AbortSignal) =>
  fetchJsonNoStore<InterviewQuestionDetail>(`/api/content/interview/${encodeURIComponent(slug)}`, signal);

export const fetchCbtCollections = (signal?: AbortSignal) =>
  fetchJsonNoStore<CbtCollections>("/api/content/cbt", signal);

export const fetchSlideshow = (slug: string, signal?: AbortSignal) =>
  fetchJsonNoStore<SlideshowDeck>(`/api/content/slideshows/${encodeURIComponent(slug)}`, signal);

export const fetchMediaItem = (
  kind: "training-videos" | "audio-books",
  slug: string,
  signal?: AbortSignal
) =>
  fetchJsonNoStore<MediaCollectionItem>(
    `/api/content/media/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`,
    signal
  );
