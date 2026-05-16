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

type MobileArchitectureNode = {
  id: string;
  title: string;
  details: string[];
};

type MobileArchitectureGroup = {
  id: string;
  title: string;
  nodes: MobileArchitectureNode[];
};

type MobileArchitecture = {
  groups: MobileArchitectureGroup[];
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

const cleanMermaidText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\\"/g, '"')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseSubgraphLine = (line: string) => {
  const match = /^\s*subgraph\s+([A-Za-z][\w-]*)(?:\s*\[\s*"([^"]+)"\s*\]|\s+(.+))?/i.exec(line);
  if (!match) return null;

  const fallbackTitle = match[3]?.replace(/^\[|\]$/g, "").replace(/^"|"$/g, "").trim();

  return {
    id: match[1],
    title: match[2] || fallbackTitle || match[1],
  };
};

const parseNodeStatement = (statement: string) => {
  const match = /^\s*([A-Za-z][\w-]*)\s*\[\s*"([\s\S]*?)"\s*\]/m.exec(statement);
  if (!match) return null;

  const lines = cleanMermaidText(match[2]);
  if (lines.length === 0) return null;

  return {
    id: match[1],
    title: lines[0],
    details: lines.slice(1).map((line) => line.replace(/^[-*]\s*/, "")),
  };
};

const parseMermaidFlowchart = (chart: string): MobileArchitecture | null => {
  if (!/^\s*(flowchart|graph)\s+/im.test(chart)) return null;

  const groups: MobileArchitectureGroup[] = [];
  const ungrouped: MobileArchitectureGroup = {
    id: "__ungrouped",
    title: "Related Components",
    nodes: [],
  };
  const groupStack: MobileArchitectureGroup[] = [];
  let pendingNodeStatement = "";

  const addNode = (statement: string, group: MobileArchitectureGroup | undefined) => {
    const node = parseNodeStatement(statement);
    if (!node) return;

    const targetGroup = group || ungrouped;
    if (!targetGroup.nodes.some((item) => item.id === node.id)) {
      targetGroup.nodes.push(node);
    }
  };

  for (const line of chart.split(/\r?\n/)) {
    if (pendingNodeStatement) {
      pendingNodeStatement += `\n${line}`;

      if (/"\s*\]/.test(line)) {
        addNode(pendingNodeStatement, groupStack[groupStack.length - 1]);
        pendingNodeStatement = "";
      }

      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%%") || /^(flowchart|graph)\s+/i.test(trimmed)) continue;
    if (/^direction\s+/i.test(trimmed)) continue;

    const subgraph = parseSubgraphLine(line);
    if (subgraph) {
      const group: MobileArchitectureGroup = {
        ...subgraph,
        nodes: [],
      };
      groups.push(group);
      groupStack.push(group);
      continue;
    }

    if (/^end\s*$/i.test(trimmed)) {
      groupStack.pop();
      continue;
    }

    if (/^\s*[A-Za-z][\w-]*\s*\[\s*"/.test(line)) {
      if (/"\s*\]/.test(line)) {
        addNode(line, groupStack[groupStack.length - 1]);
      } else {
        pendingNodeStatement = line;
      }
    }
  }

  if (pendingNodeStatement) {
    addNode(pendingNodeStatement, groupStack[groupStack.length - 1]);
  }

  const visibleGroups = groups.filter((group) => group.nodes.length > 0);
  if (ungrouped.nodes.length > 0) visibleGroups.push(ungrouped);

  return visibleGroups.length > 0 ? { groups: visibleGroups } : null;
};

const addMobileSubgraphDirection = (chart: string) =>
  chart
    .split(/\r?\n/)
    .flatMap((line, index, lines) => {
      if (!/^\s*subgraph\s+/i.test(line)) return [line];

      const nextLine = lines[index + 1] || "";
      if (/^\s*direction\s+(TB|TD|BT|LR|RL)\s*$/i.test(nextLine)) return [line];

      const indent = line.match(/^\s*/)?.[0] || "";
      return [line, `${indent}    direction TB`];
    })
    .join("\n");

const useNarrowViewport = () => {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setIsNarrow(query.matches);

    update();
    query.addEventListener?.("change", update);

    return () => query.removeEventListener?.("change", update);
  }, []);

  return isNarrow;
};

function MobileArchitectureDiagram({ architecture }: { architecture: MobileArchitecture }) {
  return (
    <div className="mobile-architecture-diagram" aria-label="Architecture diagram" role="img">
      {architecture.groups.map((group, groupIndex) => (
        <div className="mobile-architecture-diagram__layer" key={group.id}>
          <section className="mobile-architecture-diagram__group">
            <div className="mobile-architecture-diagram__group-title">{group.title}</div>
            <div className="mobile-architecture-diagram__nodes">
              {group.nodes.map((node) => (
                <article className="mobile-architecture-diagram__node" key={node.id}>
                  <div className="mobile-architecture-diagram__node-title">{node.title}</div>
                  {node.details.length > 0 && (
                    <ul className="mobile-architecture-diagram__details">
                      {node.details.map((detail, detailIndex) => (
                        <li key={`${node.id}-${detailIndex}`}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
          {groupIndex < architecture.groups.length - 1 && (
            <div className="mobile-architecture-diagram__connector" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

function MermaidDiagram({ chart }: { chart: string }) {
  const { theme } = useContext(ThemeContext);
  const isNarrow = useNarrowViewport();
  const reactId = useId();
  const renderCountRef = useRef(0);
  const diagramId = useMemo(() => `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [reactId]);
  const renderChart = useMemo(
    () => (isNarrow ? addMobileSubgraphDirection(chart) : chart).trim(),
    [chart, isNarrow]
  );
  const mobileArchitecture = useMemo(() => parseMermaidFlowchart(chart), [chart]);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setSvg("");
    setError("");

    if (isNarrow && mobileArchitecture) return;

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
            nodeSpacing: isNarrow ? 14 : 24,
            rankSpacing: isNarrow ? 22 : 34,
            diagramPadding: 8,
            wrappingWidth: isNarrow ? 120 : 150,
          },
        });

        const result = await mermaid.render(renderId, renderChart);

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
  }, [diagramId, isNarrow, mobileArchitecture, renderChart, theme]);

  if (isNarrow && mobileArchitecture) {
    return <MobileArchitectureDiagram architecture={mobileArchitecture} />;
  }

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
