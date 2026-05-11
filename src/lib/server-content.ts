import { buildContentRepoRawUrl } from "./content-repo-config";
import { normalize, parseSubjectTopicsFromReadme, type ParsedTopic } from "./readme-utils";
import type {
  CbtCollections,
  CourseCatalogEntry,
  CourseSubject,
  InterviewQuestionDetail,
  InterviewQuestionSummary,
  MediaCollectionItem,
  SlideshowDeck,
  SlideshowSlide,
  SlideshowSummary,
  TickerItem,
} from "./content-types";

type InterviewCatalogFile = {
  repoName: string;
  questions: Array<{
    slug: string;
    title: string;
    category: string;
    level: string;
    question: string;
    tags: string[];
    answerPath: string;
  }>;
};

type CoursesCatalogFile = {
  repoName: string;
  subjects: CourseCatalogEntry[];
};

type SlideshowCatalogFile = {
  repoName: string;
  decks: Array<{
    slug: string;
    title: string;
    summary: string;
    audience: string;
    tags: string[];
    contentPath: string;
  }>;
};

type MediaCatalogFile = {
  repoName: string;
  items: Array<{
    slug: string;
    title: string;
    summary: string;
    speaker: string;
    playlistUrl: string;
    embedUrl?: string;
    tags: string[];
    notesPath?: string;
  }>;
};

type TickerFeedFile = {
  repoName: string;
  items: TickerItem[];
};

const fetchRepoText = async (filePath: string) => {
  const response = await fetch(buildContentRepoRawUrl(filePath), {
    cache: "no-store",
    headers: {
      "User-Agent": "Tinitiate-Edu-App",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath} (${response.status})`);
  }

  return response.text();
};

const fetchRepoJson = async <T>(filePath: string) =>
  JSON.parse(await fetchRepoText(filePath)) as T;

const summarizeMarkdown = (markdown: string) => {
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const summaryLine = lines.find((line) => !line.startsWith("#"));
  return summaryLine ? summaryLine.replace(/^[-*+]\s+/, "") : "Content available";
};

const extractSlideTitle = (markdown: string, index: number) => {
  const match = markdown.match(/^#{1,6}\s+(.+)$/m);
  return match ? match[1].trim() : `Slide ${index + 1}`;
};

const splitSlides = (markdown: string): SlideshowSlide[] =>
  markdown
    .split(/\n---\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, index) => ({
      index,
      title: extractSlideTitle(chunk, index),
      markdown: chunk,
    }));

const loadCourseTopics = async (subject: CourseCatalogEntry): Promise<ParsedTopic[]> => {
  const readmeUrl = buildContentRepoRawUrl(subject.readmePath);
  const readmeText = await fetchRepoText(subject.readmePath);
  return parseSubjectTopicsFromReadme(readmeText, readmeUrl);
};

export const getTickerItems = async (): Promise<TickerItem[]> => {
  const feed = await fetchRepoJson<TickerFeedFile>("news-ticker/feed.json");
  return [...feed.items].sort((a, b) => a.priority - b.priority);
};

export const getInterviewQuestionSummaries = async (): Promise<InterviewQuestionSummary[]> => {
  const catalog = await fetchRepoJson<InterviewCatalogFile>("interview-qna/catalog.json");

  return Promise.all(
    catalog.questions.map(async (entry) => {
      const markdown = await fetchRepoText(entry.answerPath);

      return {
        slug: entry.slug,
        title: entry.title,
        category: entry.category,
        level: entry.level,
        question: entry.question,
        tags: entry.tags,
        excerpt: summarizeMarkdown(markdown),
      };
    })
  );
};

export const getInterviewQuestionBySlug = async (
  slug: string
): Promise<InterviewQuestionDetail | null> => {
  const catalog = await fetchRepoJson<InterviewCatalogFile>("interview-qna/catalog.json");
  const entry = catalog.questions.find((item) => item.slug === slug);

  if (!entry) return null;

  const markdown = await fetchRepoText(entry.answerPath);

  return {
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    level: entry.level,
    question: entry.question,
    tags: entry.tags,
    excerpt: summarizeMarkdown(markdown),
    markdown,
  };
};

export const getCourseSubjects = async (): Promise<CourseSubject[]> => {
  const catalog = await fetchRepoJson<CoursesCatalogFile>("courses/catalog.json");

  return Promise.all(
    catalog.subjects.map(async (entry) => {
      let topics: ParsedTopic[] = [];

      try {
        topics = await loadCourseTopics(entry);
      } catch {
        topics = [];
      }

      return {
        ...entry,
        subject: entry.title,
        readme_url: buildContentRepoRawUrl(entry.readmePath),
        topics,
      };
    })
  );
};

export const getCourseSubjectByName = async (
  subjectName: string
): Promise<CourseSubject | null> => {
  const subjects = await getCourseSubjects();
  return (
    subjects.find(
      (subject) =>
        subject.slug === subjectName || normalize(subject.subject) === normalize(subjectName)
    ) || null
  );
};

const loadMediaCollection = async (
  folderName: "training-videos" | "audio-books"
): Promise<MediaCollectionItem[]> => {
  const catalog = await fetchRepoJson<MediaCatalogFile>(`${folderName}/av-metadata.json`);

  return Promise.all(
    catalog.items.map(async (item) => {
      const notesMarkdown = item.notesPath ? await fetchRepoText(item.notesPath) : undefined;

      return {
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        speaker: item.speaker,
        playlistUrl: item.playlistUrl,
        embedUrl: item.embedUrl,
        tags: item.tags,
        notesMarkdown,
      };
    })
  );
};

export const getSlideshows = async (): Promise<SlideshowSummary[]> => {
  const catalog = await fetchRepoJson<SlideshowCatalogFile>("slideshows/av-metadata.json");

  return catalog.decks.map((deck) => ({
    slug: deck.slug,
    title: deck.title,
    summary: deck.summary,
    audience: deck.audience,
    tags: deck.tags,
  }));
};

export const getSlideshowBySlug = async (slug: string): Promise<SlideshowDeck | null> => {
  const catalog = await fetchRepoJson<SlideshowCatalogFile>("slideshows/av-metadata.json");
  const deck = catalog.decks.find((item) => item.slug === slug);

  if (!deck) return null;

  const markdown = await fetchRepoText(deck.contentPath);

  return {
    slug: deck.slug,
    title: deck.title,
    summary: deck.summary,
    audience: deck.audience,
    tags: deck.tags,
    markdown,
    slides: splitSlides(markdown),
  };
};

export const getCbtCollections = async (): Promise<CbtCollections> => {
  const [slideshows, trainingVideos, audioBooks] = await Promise.all([
    getSlideshows(),
    loadMediaCollection("training-videos"),
    loadMediaCollection("audio-books"),
  ]);

  return {
    slideshows,
    trainingVideos,
    audioBooks,
  };
};

export const getMediaCollectionByKind = async (
  kind: "training-videos" | "audio-books"
): Promise<MediaCollectionItem[]> => loadMediaCollection(kind);

export const getMediaItemBySlug = async (
  kind: "training-videos" | "audio-books",
  slug: string
): Promise<MediaCollectionItem | null> => {
  const items = await loadMediaCollection(kind);
  return items.find((item) => item.slug === slug) || null;
};
