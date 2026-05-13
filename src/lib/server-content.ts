import { buildContentRepoRawUrl } from "./content-repo-config";
import { normalize, parseSubjectTopicsFromReadme, toRawGithub, type ParsedTopic } from "./readme-utils";
import { readRepoContentSource, readRepoContentText } from "./server-content-source";
import type {
  CbtCollections,
  CourseCatalogEntry,
  CourseSubject,
  DesignSystem,
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

type DesignColorFile = Omit<DesignSystem, "courseIcons">;

type DesignIconFile = {
  repoName: string;
  courses: Record<
    string,
    {
      label: string;
      iconPath: string;
    }
  >;
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
    playlistUrl?: string;
    embedUrl?: string;
    mediaPath?: string;
    mediaUrl?: string;
    posterPath?: string;
    posterUrl?: string;
    mimeType?: string;
    tags: string[];
    notesPath?: string;
  }>;
};

type TickerFeedFile = {
  repoName: string;
  items: TickerItem[];
};

const CBT_ROOT_FOLDER = "cbt";
const resolveCbtPath = (...segments: string[]) => [CBT_ROOT_FOLDER, ...segments].join("/");

const fetchRepoText = (filePath: string, preferredRepoName?: string) =>
  readRepoContentText(filePath, preferredRepoName);

const fetchRepoTextWithSource = (filePath: string, preferredRepoName?: string) =>
  readRepoContentSource(filePath, preferredRepoName);

const resolveOptionalRepoAssetUrl = (value: string | undefined, repoName: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    return toRawGithub(trimmed);
  }

  return buildContentRepoRawUrl(trimmed, repoName);
};

const fetchRepoJsonWithSource = async <T>(filePath: string, preferredRepoName?: string) => {
  const source = await fetchRepoTextWithSource(filePath, preferredRepoName);
  return {
    ...source,
    data: JSON.parse(source.text) as T,
  };
};

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

const readOptionalMarkdownSource = async (filePath: string | undefined, repoName: string) => {
  if (!filePath) return undefined;
  return fetchRepoTextWithSource(filePath, repoName);
};

const loadCourseTopics = async (
  subject: CourseCatalogEntry,
  repoName: string
): Promise<ParsedTopic[]> => {
  const readmeUrl = buildContentRepoRawUrl(subject.readmePath, repoName);
  const readmeText = await fetchRepoText(subject.readmePath, repoName);
  return parseSubjectTopicsFromReadme(readmeText, readmeUrl);
};

const getCourseIconRegistry = async () => {
  const { data: iconFile, repoName } = await fetchRepoJsonWithSource<DesignIconFile>("design/icon.json");

  return Object.fromEntries(
    Object.entries(iconFile.courses || {}).map(([slug, entry]) => [
      slug,
      {
        ...entry,
        iconUrl: buildContentRepoRawUrl(entry.iconPath, repoName),
      },
    ])
  );
};

export const getDesignSystem = async (): Promise<DesignSystem> => {
  const [{ data: colorFile }, courseIcons] = await Promise.all([
    fetchRepoJsonWithSource<DesignColorFile>("design/colour.json"),
    getCourseIconRegistry(),
  ]);

  return {
    ...colorFile,
    courseIcons,
  };
};

export const getTickerItems = async (): Promise<TickerItem[]> => {
  const { data: feed } = await fetchRepoJsonWithSource<TickerFeedFile>("news-ticker/feed.json");
  return [...feed.items].sort((a, b) => a.priority - b.priority);
};

export const getInterviewQuestionSummaries = async (): Promise<InterviewQuestionSummary[]> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<InterviewCatalogFile>(
    "interview-qna/catalog.json"
  );

  return Promise.all(
    catalog.questions.map(async (entry) => {
      const markdown = await fetchRepoText(entry.answerPath, repoName);

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
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<InterviewCatalogFile>(
    "interview-qna/catalog.json"
  );
  const entry = catalog.questions.find((item) => item.slug === slug);

  if (!entry) return null;

  const markdownSource = await fetchRepoTextWithSource(entry.answerPath, repoName);

  return {
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    level: entry.level,
    question: entry.question,
    tags: entry.tags,
    excerpt: summarizeMarkdown(markdownSource.text),
    markdown: markdownSource.text,
    markdown_url: markdownSource.url,
  };
};

export const getCourseSubjects = async (): Promise<CourseSubject[]> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<CoursesCatalogFile>(
    "courses/catalog.json"
  );
  const courseIcons = await getCourseIconRegistry();

  return Promise.all(
    catalog.subjects.map(async (entry) => {
      let topics: ParsedTopic[] = [];

      try {
        topics = await loadCourseTopics(entry, repoName);
      } catch {
        topics = [];
      }

      return {
        ...entry,
        subject: entry.title,
        readme_url: buildContentRepoRawUrl(entry.readmePath, repoName),
        icon_url: courseIcons[entry.slug]?.iconUrl,
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
  folderName: "training-videos" | "audio-books",
  includeNotes = false
): Promise<MediaCollectionItem[]> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<MediaCatalogFile>(
    resolveCbtPath(folderName, "av-metadata.json")
  );

  return Promise.all(
    catalog.items.map(async (item) => {
      const notesSource = includeNotes
        ? await readOptionalMarkdownSource(item.notesPath, repoName)
        : undefined;

      return {
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        speaker: item.speaker,
        playlistUrl: item.playlistUrl,
        embedUrl: item.embedUrl,
        mediaUrl:
          resolveOptionalRepoAssetUrl(item.mediaPath, repoName) ||
          resolveOptionalRepoAssetUrl(item.mediaUrl, repoName),
        posterUrl:
          resolveOptionalRepoAssetUrl(item.posterPath, repoName) ||
          resolveOptionalRepoAssetUrl(item.posterUrl, repoName),
        mimeType: item.mimeType,
        tags: item.tags,
        notesMarkdown: notesSource?.text,
        notesMarkdownUrl: notesSource?.url,
      };
    })
  );
};

export const getSlideshows = async (): Promise<SlideshowSummary[]> => {
  const { data: catalog } = await fetchRepoJsonWithSource<SlideshowCatalogFile>(
    resolveCbtPath("slideshows", "av-metadata.json")
  );

  return catalog.decks.map((deck) => ({
    slug: deck.slug,
    title: deck.title,
    summary: deck.summary,
    audience: deck.audience,
    tags: deck.tags,
  }));
};

export const getSlideshowBySlug = async (slug: string): Promise<SlideshowDeck | null> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<SlideshowCatalogFile>(
    resolveCbtPath("slideshows", "av-metadata.json")
  );
  const deck = catalog.decks.find((item) => item.slug === slug);

  if (!deck) return null;

  const markdownSource = await fetchRepoTextWithSource(deck.contentPath, repoName);

  return {
    slug: deck.slug,
    title: deck.title,
    summary: deck.summary,
    audience: deck.audience,
    tags: deck.tags,
    markdown: markdownSource.text,
    markdown_url: markdownSource.url,
    slides: splitSlides(markdownSource.text),
  };
};

export const getCbtCollections = async (): Promise<CbtCollections> => {
  const [slideshows, trainingVideos, audioBooks] = await Promise.all([
    getSlideshows(),
    loadMediaCollection("training-videos", false),
    loadMediaCollection("audio-books", false),
  ]);

  return {
    slideshows,
    trainingVideos,
    audioBooks,
  };
};

export const getMediaCollectionByKind = async (
  kind: "training-videos" | "audio-books"
): Promise<MediaCollectionItem[]> => loadMediaCollection(kind, false);

export const getMediaItemBySlug = async (
  kind: "training-videos" | "audio-books",
  slug: string
): Promise<MediaCollectionItem | null> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<MediaCatalogFile>(
    resolveCbtPath(kind, "av-metadata.json")
  );
  const item = catalog.items.find((entry) => entry.slug === slug);

  if (!item) {
    return null;
  }

  const notesSource = await readOptionalMarkdownSource(item.notesPath, repoName);

  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    speaker: item.speaker,
    playlistUrl: item.playlistUrl,
    embedUrl: item.embedUrl,
    mediaUrl:
      resolveOptionalRepoAssetUrl(item.mediaPath, repoName) ||
      resolveOptionalRepoAssetUrl(item.mediaUrl, repoName),
    posterUrl:
      resolveOptionalRepoAssetUrl(item.posterPath, repoName) ||
      resolveOptionalRepoAssetUrl(item.posterUrl, repoName),
    mimeType: item.mimeType,
    tags: item.tags,
    notesMarkdown: notesSource?.text,
    notesMarkdownUrl: notesSource?.url,
  };
};
