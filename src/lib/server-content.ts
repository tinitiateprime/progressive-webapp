import { parse as parseYaml } from "yaml";
import { buildContentRepoRawUrl } from "./content-repo-config";
import { normalize, parseSubjectTopicsFromReadme, toRawGithub, type ParsedTopic } from "./readme-utils";
import { readRepoContentSource, readRepoContentText } from "./server-content-source";
import type {
  CbtCollections,
  CourseCatalogEntry,
  CourseSubject,
  DashboardImagePosition,
  DashboardCardTopic,
  DashboardSlideStyle,
  DashboardSlideTemplate,
  DashboardTextAlign,
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
  templateFiles?: Array<string | { path: string }>;
  files?: Array<string | { path: string }>;
  cardFiles?: Array<string | { path: string }>;
  defaults?: DashboardSlideStyleInput;
  template?: string;
  imagePosition?: string;
  textAlign?: string;
  titleSize?: string | number;
  bodySize?: string | number;
  eyebrowSize?: string | number;
  imageSize?: string | number;
  mobileImageSize?: string | number;
  topics?: Array<{
    id: string;
    title: string;
    label?: string;
    accent?: string;
    imageSurface?: string;
    imagePath?: string;
    imageUrl?: string;
    defaults?: DashboardSlideStyleInput;
    style?: DashboardSlideStyleInput;
    template?: string;
    imagePosition?: string;
    textAlign?: string;
    titleSize?: string | number;
    bodySize?: string | number;
    eyebrowSize?: string | number;
    imageSize?: string | number;
    mobileImageSize?: string | number;
    slides: Array<{
      eyebrow?: string;
      title: string;
      body?: string;
      imageAlt?: string;
      imagePath?: string;
      imageUrl?: string;
      style?: DashboardSlideStyleInput;
      template?: string;
      imagePosition?: string;
      textAlign?: string;
      titleSize?: string | number;
      bodySize?: string | number;
      eyebrowSize?: string | number;
      imageSize?: string | number;
      mobileImageSize?: string | number;
    }>;
  }>;
};

type DashboardSlideStyleInput = {
  template?: string;
  imagePosition?: string;
  textAlign?: string;
  titleSize?: string | number;
  bodySize?: string | number;
  eyebrowSize?: string | number;
  imageSize?: string | number;
  mobileImageSize?: string | number;
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

const dashboardTemplateValues = new Set<DashboardSlideTemplate>(["text", "imageText", "image"]);
const dashboardImagePositions = new Set<DashboardImagePosition>(["left", "right", "top", "bottom"]);
const dashboardTextAlignments = new Set<DashboardTextAlign>(["left", "center", "right"]);

const normalizeDashboardTemplate = (value: string | undefined): DashboardSlideTemplate | undefined => {
  const normalized = String(value || "").trim();
  if (dashboardTemplateValues.has(normalized as DashboardSlideTemplate)) {
    return normalized as DashboardSlideTemplate;
  }

  const compact = normalized.toLowerCase().replace(/[\s_-]+/g, "");
  if (compact === "text") return "text";
  if (compact === "imagetext" || compact === "textimage") return "imageText";
  if (compact === "image") return "image";
  return undefined;
};

const normalizeDashboardImagePosition = (
  value: string | undefined
): DashboardImagePosition | undefined => {
  const normalized = String(value || "").trim().toLowerCase();
  if (dashboardImagePositions.has(normalized as DashboardImagePosition)) {
    return normalized as DashboardImagePosition;
  }

  const compact = normalized.replace(/[\s_-]+/g, "");
  if (compact === "imageleft") return "left";
  if (compact === "imageright") return "right";
  if (compact === "imagetop") return "top";
  if (compact === "imagebottom") return "bottom";
  return undefined;
};

const normalizeDashboardTextAlign = (value: string | undefined): DashboardTextAlign | undefined => {
  const normalized = String(value || "").trim().toLowerCase();
  return dashboardTextAlignments.has(normalized as DashboardTextAlign)
    ? (normalized as DashboardTextAlign)
    : undefined;
};

const normalizeDashboardCssValue = (value: string | number | undefined) => {
  if (value === undefined || value === null) return undefined;
  const normalized = typeof value === "number" ? `${value}px` : String(value).trim();
  if (!normalized) return undefined;
  return normalized.replace(/[;"{}]/g, "");
};

const pickDashboardStyle = (input: DashboardSlideStyleInput | undefined): DashboardSlideStyleInput => {
  const picked: DashboardSlideStyleInput = {};
  if (input?.template !== undefined) picked.template = input.template;
  if (input?.imagePosition !== undefined) picked.imagePosition = input.imagePosition;
  if (input?.textAlign !== undefined) picked.textAlign = input.textAlign;
  if (input?.titleSize !== undefined) picked.titleSize = input.titleSize;
  if (input?.bodySize !== undefined) picked.bodySize = input.bodySize;
  if (input?.eyebrowSize !== undefined) picked.eyebrowSize = input.eyebrowSize;
  if (input?.imageSize !== undefined) picked.imageSize = input.imageSize;
  if (input?.mobileImageSize !== undefined) picked.mobileImageSize = input.mobileImageSize;
  return picked;
};

const mergeDashboardSlideStyle = (
  ...inputs: Array<DashboardSlideStyleInput | undefined>
): { template: DashboardSlideTemplate; style: DashboardSlideStyle } => {
  const merged = inputs.reduce<DashboardSlideStyleInput>(
    (acc, input) => ({
      ...acc,
      ...pickDashboardStyle(input),
    }),
    {}
  );

  return {
    template: normalizeDashboardTemplate(merged.template) || "text",
    style: {
      imagePosition: normalizeDashboardImagePosition(merged.imagePosition) || "left",
      textAlign: normalizeDashboardTextAlign(merged.textAlign) || "left",
      ...(normalizeDashboardCssValue(merged.titleSize)
        ? { titleSize: normalizeDashboardCssValue(merged.titleSize) }
        : {}),
      ...(normalizeDashboardCssValue(merged.bodySize)
        ? { bodySize: normalizeDashboardCssValue(merged.bodySize) }
        : {}),
      ...(normalizeDashboardCssValue(merged.eyebrowSize)
        ? { eyebrowSize: normalizeDashboardCssValue(merged.eyebrowSize) }
        : {}),
      ...(normalizeDashboardCssValue(merged.imageSize)
        ? { imageSize: normalizeDashboardCssValue(merged.imageSize) }
        : {}),
      ...(normalizeDashboardCssValue(merged.mobileImageSize)
        ? { mobileImageSize: normalizeDashboardCssValue(merged.mobileImageSize) }
        : {}),
    },
  };
};

const getDashboardStyleInput = (
  input:
    | (DashboardSlideStyleInput & { style?: DashboardSlideStyleInput; defaults?: DashboardSlideStyleInput })
    | undefined
): DashboardSlideStyleInput => ({
  ...pickDashboardStyle(input?.defaults),
  ...pickDashboardStyle(input),
  ...pickDashboardStyle(input?.style),
});

const getDashboardTemplateFilePaths = (file: DashboardCardsFile) =>
  [...(file.templateFiles || []), ...(file.files || []), ...(file.cardFiles || [])]
    .map((entry) => (typeof entry === "string" ? entry : entry.path))
    .map((path) => String(path || "").trim())
    .filter(Boolean);

const fetchRepoYamlWithSource = async <T>(
  filePath: string,
  preferredRepoName?: string,
  repoRef?: string
) => {
  const source = await fetchRepoTextWithSource(filePath, preferredRepoName, repoRef);
  return {
    ...source,
    data: parseYaml(source.text) as T,
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
  const { data: iconFile, repoName } = await fetchRepoYamlWithSource<DesignIconFile>(
    "design/icon.yaml",
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
    fetchRepoYamlWithSource<DesignColorFile>("design/colour.yaml", undefined, repoRef),
    getCourseIconRegistry(repoRef),
  ]);

  return {
    ...colorFile,
    courseIcons,
  };
};

export const getTickerItems = async (repoRef?: string): Promise<TickerItem[]> => {
  const { data: feed } = await fetchRepoYamlWithSource<TickerFeedFile>(
    "news-ticker/feed.yaml",
    undefined,
    repoRef
  );
  return [...feed.items].sort((a, b) => a.priority - b.priority);
};

export const getDashboardCards = async (repoRef?: string): Promise<DashboardCardTopic[]> => {
  const { data: indexFile, repoName } = await fetchRepoYamlWithSource<DashboardCardsFile>(
    "dashboard/cards.yaml",
    undefined,
    repoRef
  );

  const templateFilePaths = getDashboardTemplateFilePaths(indexFile);
  const sourceFiles =
    templateFilePaths.length > 0
      ? await Promise.all(
          templateFilePaths.map((filePath) =>
            fetchRepoYamlWithSource<DashboardCardsFile>(filePath, repoName, repoRef)
          )
        )
      : [{ data: indexFile, repoName }];

  const topicSources = sourceFiles.flatMap((source) => {
    const topics = Array.isArray(source.data.topics) ? source.data.topics : [];
    const fileStyle = getDashboardStyleInput(source.data);

    return topics.map((topic) => ({
      topic,
      repoName: source.repoName,
      fileStyle,
    }));
  });

  return topicSources
    .map(({ topic, repoName: sourceRepoName, fileStyle }, topicIndex) => {
      const topicStyle = getDashboardStyleInput(topic);
      const slides = (Array.isArray(topic.slides) ? topic.slides : [])
        .map((slide, slideIndex) => {
          const title = String(slide.title || "").trim();
          if (!title) return null;

          const imageUrl =
            resolveOptionalRepoAssetUrl(slide.imagePath || slide.imageUrl, sourceRepoName, repoRef) ||
            resolveOptionalRepoAssetUrl(topic.imagePath || topic.imageUrl, sourceRepoName, repoRef);
          const presentation = mergeDashboardSlideStyle(
            { template: imageUrl ? "imageText" : "text" },
            fileStyle,
            topicStyle,
            getDashboardStyleInput(slide)
          );

          return {
            template: presentation.template,
            eyebrow: String(slide.eyebrow || `Slide ${slideIndex + 1}`).trim(),
            title,
            body: String(slide.body || "").trim(),
            imageAlt: String(slide.imageAlt || `${title} visual`).trim(),
            ...(imageUrl ? { imageUrl } : {}),
            style: presentation.style,
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
  // ONE GitHub request: just the catalog YAML.
  // The `question` field already contains the question text which serves as the
  // excerpt on the list page — no need to fetch each answer markdown file here.
  const { data: catalog } = await fetchRepoYamlWithSource<InterviewCatalogFile>(
    "interview-qna/catalog.yaml",
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
  const { data: catalog, repoName } = await fetchRepoYamlWithSource<InterviewCatalogFile>(
    "interview-qna/catalog.yaml",
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
    fetchRepoYamlWithSource<CoursesCatalogFile>("courses/catalog.yaml", undefined, repoRef),
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
  const { data: catalog, repoName } = await fetchRepoYamlWithSource<MediaCatalogFile>(
    resolveCbtPath(folderName, "av-metadata.yaml"),
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
  const { data: catalog } = await fetchRepoYamlWithSource<SlideshowCatalogFile>(
    resolveCbtPath("slideshows", "av-metadata.yaml"),
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
  const { data: catalog, repoName } = await fetchRepoYamlWithSource<SlideshowCatalogFile>(
    resolveCbtPath("slideshows", "av-metadata.yaml"),
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
  const { data: catalog, repoName } = await fetchRepoYamlWithSource<MediaCatalogFile>(
    resolveCbtPath(kind, "av-metadata.yaml"),
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
