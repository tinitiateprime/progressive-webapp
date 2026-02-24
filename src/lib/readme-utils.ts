// File: src/lib/readme-utils.ts

export type ParsedTopic = {
  topic_name: string;
  md_url: string;
  bullets?: string[];
  section_markdown?: string;
};

export type MainCatalogSubjectLink = {
  subject: string;
  readme_url: string;
};

export const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const toRawGithub = (u: string) => {
  const m = u.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );
  if (!m) return u;
  const [, owner, repo, branch, path] = m;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};

const cleanTitle = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s*\*\s*https?:\/\/.*$/i, "")
    .replace(/\s*https?:\/\/.*$/i, "")
    .trim();

const extractFirstUrl = (text: string) => {
  const m = text.match(/\bhttps?:\/\/[^\s)]+/);
  if (!m) return "";
  let url = m[0].replace(/[)\],]+$/g, "");
  if (url.includes("github.com/") && url.includes("/blob/")) url = toRawGithub(url);
  return url;
};

const resolveMaybeRelativeUrl = (url: string, baseUrl?: string) => {
  if (!url) return "";
  const v = url.trim();

  if (/^https?:\/\//i.test(v)) return toRawGithub(v);

  if (baseUrl) {
    try {
      return toRawGithub(new URL(v, baseUrl).toString());
    } catch {
      return v;
    }
  }

  return v;
};

const extractMarkdownLinkAnywhere = (
  text: string,
  baseUrl?: string
): { title: string; url: string } | null => {
  const m = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!m) return null;

  const title = cleanTitle(m[1]);
  const url = resolveMaybeRelativeUrl(m[2], baseUrl);

  if (!url) return null;
  return { title, url };
};

const parseBulletsFromSection = (sectionText: string): string[] => {
  const bullets: string[] = [];
  const lines = (sectionText || "").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === "---") continue;

    let m = line.match(/^[-*+]\s+(.+)$/);
    if (m) {
      bullets.push(m[1].trim());
      continue;
    }

    m = line.match(/^\d+\.\s+(.+)$/);
    if (m) {
      bullets.push(m[1].trim());
      continue;
    }
  }

  return bullets;
};

// ✅ Parses main app catalog README (subject list)
export function parseMainCatalogReadme(md: string): MainCatalogSubjectLink[] {
  const lines = (md || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim());

  const results: MainCatalogSubjectLink[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (!h2) continue;

    const link = extractMarkdownLinkAnywhere(h2[1].trim());
    if (!link) continue;

    const key = `${normalize(link.title)}|${link.url}`;
    if (seen.has(key)) continue;

    results.push({
      subject: link.title,
      readme_url: toRawGithub(link.url),
    });
    seen.add(key);
  }

  return results;
}

/**
 * ✅ Parses subject README topics like:
 * ## 📘 [Introduction](./01-introduction.md)
 * - What is Vue?
 * - SPA vs MPA
 * ---
 * ## 🚀 [Getting Started](./02-getting-started.md)
 *
 * Supports relative .md links using subjectReadmeUrl as base.
 */
export function parseSubjectTopicsFromReadme(
  md: string,
  subjectReadmeUrl?: string
): ParsedTopic[] {
  const lines = (md || "").replace(/\r/g, "\n").split("\n");

  type Hit = {
    index: number;
    level: number;
    title: string;
    url: string;
  };

  const hits: Hit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (!h) continue;

    const level = h[1].length;
    const headingBody = h[2].trim();

    // skip page title (# Vue.js Tutorial ...)
    if (level === 1) continue;

    let title = "";
    let url = "";

    const mdLink = extractMarkdownLinkAnywhere(headingBody, subjectReadmeUrl);
    if (mdLink) {
      title = mdLink.title;
      url = mdLink.url;
    } else {
      // fallback: heading text + URL on nearby following lines
      title = cleanTitle(headingBody);

      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (/^#{1,6}\s+/.test(next)) break;

        const nextMdLink = extractMarkdownLinkAnywhere(next, subjectReadmeUrl);
        if (nextMdLink) {
          url = nextMdLink.url;
          break;
        }

        const direct = extractFirstUrl(next);
        if (direct) {
          url = resolveMaybeRelativeUrl(direct, subjectReadmeUrl);
          break;
        }
      }
    }

    if (!title || !url || !/\.md(\?|#|$)/i.test(url)) continue;

    hits.push({
      index: i,
      level,
      title,
      url: toRawGithub(url),
    });
  }

  const topics: ParsedTopic[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];

    const start = hit.index + 1;
    let end = lines.length;

    for (let j = start; j < lines.length; j++) {
      const m = lines[j].trim().match(/^(#{1,6})\s+(.*)$/);
      if (!m) continue;

      const nextLevel = m[1].length;
      if (nextLevel <= hit.level) {
        end = j;
        break;
      }
    }

    const sectionContent = lines.slice(start, end).join("\n").trim();
    const bullets = parseBulletsFromSection(sectionContent);

    const key = `${normalize(hit.title)}|${hit.url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    topics.push({
      topic_name: hit.title,
      md_url: hit.url,
      bullets,
      section_markdown: sectionContent,
    });
  }

  return topics;
}

// ✅ direct fetch + proxy fallback
export async function fetchTextStrict(url: string, signal?: AbortSignal): Promise<string> {
  try {
    const r = await fetch(url, { cache: "no-store", signal });
    if (r.ok) return await r.text();
  } catch {
    // fallback below
  }

  const r2 = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
    cache: "no-store",
    signal,
  });

  if (!r2.ok) {
    throw new Error(`Fetch failed (HTTP ${r2.status}) for ${url}`);
  }

  return await r2.text();
}