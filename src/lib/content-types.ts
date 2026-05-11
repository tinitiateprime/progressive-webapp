import type { ParsedTopic } from "./readme-utils";

export type TickerItem = {
  id: string;
  kind: "jobs" | "trending-technologies" | "events";
  label: string;
  title: string;
  href: string;
  priority: number;
};

export type InterviewQuestionSummary = {
  slug: string;
  title: string;
  category: string;
  level: string;
  question: string;
  tags: string[];
  excerpt: string;
};

export type InterviewQuestionDetail = InterviewQuestionSummary & {
  markdown: string;
};

export type CourseCatalogEntry = {
  slug: string;
  title: string;
  category: string;
  level: string;
  summary: string;
  readmePath: string;
};

export type CourseSubject = CourseCatalogEntry & {
  subject: string;
  readme_url: string;
  topics: ParsedTopic[];
};

export type SlideshowSummary = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  tags: string[];
};

export type SlideshowSlide = {
  index: number;
  title: string;
  markdown: string;
};

export type SlideshowDeck = SlideshowSummary & {
  markdown: string;
  slides: SlideshowSlide[];
};

export type MediaCollectionItem = {
  slug: string;
  title: string;
  summary: string;
  speaker: string;
  playlistUrl: string;
  embedUrl?: string;
  tags: string[];
  notesMarkdown?: string;
};

export type CbtCollections = {
  slideshows: SlideshowSummary[];
  trainingVideos: MediaCollectionItem[];
  audioBooks: MediaCollectionItem[];
};
