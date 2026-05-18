import { buildContentRepoRawUrl } from "./content-repo-config";
import { normalize, parseSubjectTopicsFromReadme, toRawGithub, type ParsedTopic } from "./readme-utils";
import { readRepoContentSource, readRepoContentText } from "./server-content-source";
import type {
  CbtCollections,
  CourseCatalogEntry,
  CourseSubject,
  DashboardCardTopic,
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

type DashboardCardsFile = {
  repoName: string;
  topics: Array<{
    id: string;
    title: string;
    label?: string;
    accent?: string;
    imageSurface?: string;
    imagePath?: string;
    imageUrl?: string;
    slides: Array<{
      eyebrow?: string;
      title: string;
      body?: string;
      imageAlt?: string;
      imagePath?: string;
      imageUrl?: string;
    }>;
  }>;
};

const CBT_ROOT_FOLDER = "cbt";
const resolveCbtPath = (...segments: string[]) => [CBT_ROOT_FOLDER, ...segments].join("/");

const fetchRepoText = (filePath: string, preferredRepoName?: string, repoRef?: string) =>
  readRepoContentText(filePath, preferredRepoName, repoRef);

const fetchRepoTextWithSource = (filePath: string, preferredRepoName?: string, repoRef?: string) =>
  readRepoContentSource(filePath, preferredRepoName, repoRef);

/** Run async tasks with bounded concurrency to avoid flooding GitHub. */
const runConcurrent = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 4
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  const queue = items.map((item, index) => ({ item, index }));

  const worker = async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) return;
      results[task.index] = await fn(task.item);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
};

const resolveOptionalRepoAssetUrl = (
  value: string | undefined,
  repoName: string,
  repoRef?: string
) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    return toRawGithub(trimmed);
  }

  return buildContentRepoRawUrl(trimmed, repoName, repoRef);
};

const fetchRepoJsonWithSource = async <T>(
  filePath: string,
  preferredRepoName?: string,
  repoRef?: string
) => {
  const source = await fetchRepoTextWithSource(filePath, preferredRepoName, repoRef);
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

const readOptionalMarkdownSource = async (
  filePath: string | undefined,
  repoName: string,
  repoRef?: string
) => {
  if (!filePath) return undefined;
  return fetchRepoTextWithSource(filePath, repoName, repoRef);
};

const loadCourseTopics = async (
  subject: CourseCatalogEntry,
  repoName: string,
  repoRef?: string
): Promise<ParsedTopic[]> => {
  const readmeUrl = buildContentRepoRawUrl(subject.readmePath, repoName, repoRef);
  const readmeText = await fetchRepoText(subject.readmePath, repoName, repoRef);
  return parseSubjectTopicsFromReadme(readmeText, readmeUrl);
};

const getCourseIconRegistry = async (repoRef?: string) => {
  const { data: iconFile, repoName } = await fetchRepoJsonWithSource<DesignIconFile>(
    "design/icon.json",
    undefined,
    repoRef
  );

  return Object.fromEntries(
    Object.entries(iconFile.courses || {}).map(([slug, entry]) => [
      slug,
      {
        ...entry,
        iconUrl: buildContentRepoRawUrl(entry.iconPath, repoName, repoRef),
      },
    ])
  );
};

export const getDesignSystem = async (repoRef?: string): Promise<DesignSystem> => {
  const [{ data: colorFile }, courseIcons] = await Promise.all([
    fetchRepoJsonWithSource<DesignColorFile>("design/colour.json", undefined, repoRef),
    getCourseIconRegistry(repoRef),
  ]);

  return {
    ...colorFile,
    courseIcons,
  };
};

export const getTickerItems = async (repoRef?: string): Promise<TickerItem[]> => {
  const { data: feed } = await fetchRepoJsonWithSource<TickerFeedFile>(
    "news-ticker/feed.json",
    undefined,
    repoRef
  );
  return [...feed.items].sort((a, b) => a.priority - b.priority);
};

export const getDashboardCards = async (repoRef?: string): Promise<DashboardCardTopic[]> => {
  const { data: file, repoName } = await fetchRepoJsonWithSource<DashboardCardsFile>(
    "dashboard/cards.json",
    undefined,
    repoRef
  );

  const topics = Array.isArray(file.topics) ? file.topics : [];

  return topics
    .map((topic, topicIndex) => {
      const slides = (Array.isArray(topic.slides) ? topic.slides : [])
        .map((slide, slideIndex) => {
          const title = String(slide.title || "").trim();
          if (!title) return null;

          const imageUrl =
            resolveOptionalRepoAssetUrl(slide.imagePath || slide.imageUrl, repoName, repoRef) ||
            resolveOptionalRepoAssetUrl(topic.imagePath || topic.imageUrl, repoName, repoRef);

          return {
            eyebrow: String(slide.eyebrow || `Slide ${slideIndex + 1}`).trim(),
            title,
            body: String(slide.body || "").trim(),
            imageAlt: String(slide.imageAlt || `${title} visual`).trim(),
            ...(imageUrl ? { imageUrl } : {}),
          };
        })
        .filter((slide): slide is DashboardCardTopic["slides"][number] => slide !== null);

      if (slides.length === 0) return null;

      return {
        id: String(topic.id || `dashboard-topic-${topicIndex + 1}`).trim(),
        title: String(topic.title || `Topic ${topicIndex + 1}`).trim(),
        label: String(topic.label || "Dashboard topic").trim(),
        accent: String(topic.accent || "var(--dashboard-section-courses-accent)").trim(),
        imageSurface: String(
          topic.imageSurface ||
            "linear-gradient(135deg, color-mix(in srgb, var(--brand) 14%, var(--surface)), color-mix(in srgb, var(--brand-2) 10%, var(--surface)))"
        ).trim(),
        slides,
      };
    })
    .filter((topic): topic is DashboardCardTopic => topic !== null);
};

export const getInterviewQuestionSummaries = async (
  repoRef?: string
): Promise<InterviewQuestionSummary[]> => {
  // ONE GitHub request: just the catalog JSON.
  // The `question` field already contains the question text which serves as the
  // excerpt on the list page — no need to fetch each answer markdown file here.
  const { data: catalog } = await fetchRepoJsonWithSource<InterviewCatalogFile>(
    "interview-qna/catalog.json",
    undefined,
    repoRef
  );

  return catalog.questions.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    level: entry.level,
    question: entry.question,
    tags: entry.tags,
    // Use the question itself as the excerpt — avoids N round-trips to GitHub.
    excerpt: entry.question,
  }));
};

export const getInterviewQuestionBySlug = async (
  slug: string,
  repoRef?: string
): Promise<InterviewQuestionDetail | null> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<InterviewCatalogFile>(
    "interview-qna/catalog.json",
    undefined,
    repoRef
  );
  const entry = catalog.questions.find((item) => item.slug === slug);

  if (!entry) return null;

  const markdownSource = await fetchRepoTextWithSource(entry.answerPath, repoName, repoRef);

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

export const getCourseSubjects = async (repoRef?: string): Promise<CourseSubject[]> => {
  // Two parallel requests: catalog + icon registry (independent of each other).
  const [{ data: catalog, repoName }, courseIcons] = await Promise.all([
    fetchRepoJsonWithSource<CoursesCatalogFile>("courses/catalog.json", undefined, repoRef),
    getCourseIconRegistry(repoRef),
  ]);

  // Fetch each course README with bounded concurrency (4 at a time).
  // Previously this was Promise.all which fired ALL at once and could hit
  // GitHub rate limits or saturate the connection on large catalogs.
  return runConcurrent(
    catalog.subjects,
    async (entry) => {
      let topics: ParsedTopic[] = [];

      try {
        topics = await loadCourseTopics(entry, repoName, repoRef);
      } catch {
        topics = [];
      }

      return {
        ...entry,
        subject: entry.title,
        readme_url: buildContentRepoRawUrl(entry.readmePath, repoName, repoRef),
        icon_url: courseIcons[entry.slug]?.iconUrl,
        topics,
      };
    },
    4
  );
};

export const getCourseSubjectByName = async (
  subjectName: string,
  repoRef?: string
): Promise<CourseSubject | null> => {
  const subjects = await getCourseSubjects(repoRef);
  return (
    subjects.find(
      (subject) =>
        subject.slug === subjectName || normalize(subject.subject) === normalize(subjectName)
    ) || null
  );
};

const loadMediaCollection = async (
  folderName: "training-videos" | "audio-books",
  includeNotes = false,
  repoRef?: string
): Promise<MediaCollectionItem[]> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<MediaCatalogFile>(
    resolveCbtPath(folderName, "av-metadata.json"),
    undefined,
    repoRef
  );

  return Promise.all(
    catalog.items.map(async (item) => {
      const notesSource = includeNotes
        ? await readOptionalMarkdownSource(item.notesPath, repoName, repoRef)
        : undefined;

      return {
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        speaker: item.speaker,
        playlistUrl: item.playlistUrl,
        embedUrl: item.embedUrl,
        mediaUrl:
          resolveOptionalRepoAssetUrl(item.mediaPath, repoName, repoRef) ||
          resolveOptionalRepoAssetUrl(item.mediaUrl, repoName, repoRef),
        posterUrl:
          resolveOptionalRepoAssetUrl(item.posterPath, repoName, repoRef) ||
          resolveOptionalRepoAssetUrl(item.posterUrl, repoName, repoRef),
        mimeType: item.mimeType,
        tags: item.tags,
        notesMarkdown: notesSource?.text,
        notesMarkdownUrl: notesSource?.url,
      };
    })
  );
};

export const getSlideshows = async (repoRef?: string): Promise<SlideshowSummary[]> => {
  const { data: catalog } = await fetchRepoJsonWithSource<SlideshowCatalogFile>(
    resolveCbtPath("slideshows", "av-metadata.json"),
    undefined,
    repoRef
  );

  return catalog.decks.map((deck) => ({
    slug: deck.slug,
    title: deck.title,
    summary: deck.summary,
    audience: deck.audience,
    tags: deck.tags,
  }));
};

export const getSlideshowBySlug = async (
  slug: string,
  repoRef?: string
): Promise<SlideshowDeck | null> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<SlideshowCatalogFile>(
    resolveCbtPath("slideshows", "av-metadata.json"),
    undefined,
    repoRef
  );
  const deck = catalog.decks.find((item) => item.slug === slug);

  if (!deck) return null;

  const markdownSource = await fetchRepoTextWithSource(deck.contentPath, repoName, repoRef);

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

export const getCbtCollections = async (repoRef?: string): Promise<CbtCollections> => {
  const [slideshows, trainingVideos, audioBooks] = await Promise.all([
    getSlideshows(repoRef),
    loadMediaCollection("training-videos", false, repoRef),
    loadMediaCollection("audio-books", false, repoRef),
  ]);

  return {
    slideshows,
    trainingVideos,
    audioBooks,
  };
};

export const getMediaCollectionByKind = async (
  kind: "training-videos" | "audio-books",
  repoRef?: string
): Promise<MediaCollectionItem[]> => loadMediaCollection(kind, false, repoRef);

export const getMediaItemBySlug = async (
  kind: "training-videos" | "audio-books",
  slug: string,
  repoRef?: string
): Promise<MediaCollectionItem | null> => {
  const { data: catalog, repoName } = await fetchRepoJsonWithSource<MediaCatalogFile>(
    resolveCbtPath(kind, "av-metadata.json"),
    undefined,
    repoRef
  );
  const item = catalog.items.find((entry) => entry.slug === slug);

  if (!item) {
    return null;
  }

  const notesSource = await readOptionalMarkdownSource(item.notesPath, repoName, repoRef);

  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    speaker: item.speaker,
    playlistUrl: item.playlistUrl,
    embedUrl: item.embedUrl,
    mediaUrl:
      resolveOptionalRepoAssetUrl(item.mediaPath, repoName, repoRef) ||
      resolveOptionalRepoAssetUrl(item.mediaUrl, repoName, repoRef),
    posterUrl:
      resolveOptionalRepoAssetUrl(item.posterPath, repoName, repoRef) ||
      resolveOptionalRepoAssetUrl(item.posterUrl, repoName, repoRef),
    mimeType: item.mimeType,
    tags: item.tags,
    notesMarkdown: notesSource?.text,
    notesMarkdownUrl: notesSource?.url,
  };
};
