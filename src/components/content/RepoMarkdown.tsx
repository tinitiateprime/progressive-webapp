"use client";

import {
  Children,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { ThemeContext } from "../../context/ThemeContext";
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

const getNodeText = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  return "";
};

const getCodeLanguage = (className?: string) => {
  const match = /language-([\w-]+)/i.exec(className || "");
  return match?.[1]?.toLowerCase() || "";
};

function MermaidDiagram({ chart }: { chart: string }) {
  const { theme } = useContext(ThemeContext);
  const reactId = useId();
  const renderCountRef = useRef(0);
  const diagramId = useMemo(() => `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [reactId]);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setSvg("");
    setError("");

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const renderId = `${diagramId}-${renderCountRef.current++}`;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: theme === "dark" ? "dark" : "default",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });

        const result = await mermaid.render(renderId, chart.trim());

        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to render Mermaid diagram.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId, theme]);

  if (error) {
    return (
      <div className="mermaid-diagram mermaid-diagram--error">
        <div className="mermaid-diagram__message">Unable to render architecture diagram.</div>
        <pre>
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-diagram mermaid-diagram--loading" role="status">
        Rendering architecture diagram...
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram"
      aria-label="Architecture diagram"
      role="img"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function RepoMarkdown({ children, baseUrl, components }: RepoMarkdownProps) {
  const markdownComponents: Components = {
    ...components,
    pre({ children }) {
      const onlyChild = Children.toArray(children)[0];
      if (
        isValidElement<{ className?: string }>(onlyChild) &&
        getCodeLanguage(onlyChild.props.className) === "mermaid"
      ) {
        return <>{children}</>;
      }

      return <pre>{children}</pre>;
    },
    code({ inline, className, children, ...props }: any) {
      const language = getCodeLanguage(className);
      const raw = getNodeText(children).replace(/\n$/, "");

      if (!inline && language === "mermaid") {
        return <MermaidDiagram chart={raw} />;
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
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
