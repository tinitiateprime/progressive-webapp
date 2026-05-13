"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { toGithubProxyUrl } from "../../lib/readme-utils";
import CachedRepoImage from "./CachedRepoImage";

export const resolveRepoImageSrc = (src: unknown, baseUrl?: string) => {
  if (!src || typeof src !== "string") return "";

  const value = src.trim();
  if (!value || value.startsWith("data:")) return value;

  if (/^https?:\/\//i.test(value)) {
    return toGithubProxyUrl(value);
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (!baseUrl) {
    return value;
  }

  try {
    return toGithubProxyUrl(new URL(value, baseUrl).toString());
  } catch {
    return value;
  }
};

type RepoMarkdownProps = {
  children: string;
  baseUrl?: string;
  components?: Components;
};

export default function RepoMarkdown({ children, baseUrl, components }: RepoMarkdownProps) {
  const markdownComponents: Components = {
    ...components,
    img({ src = "", alt = "" }) {
      const finalSrc = resolveRepoImageSrc(src, baseUrl);
      if (!finalSrc) return null;

      return (
        <div className="md-image-wrapper">
          <CachedRepoImage src={finalSrc} alt={alt || ""} loading="lazy" />
        </div>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}
