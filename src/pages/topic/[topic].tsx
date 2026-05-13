"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaHome,
  FaMoon,
  FaSearch,
  FaSun,
} from "react-icons/fa";
import { materialDark, materialLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ThemeContext } from "../../context/ThemeContext";
import { resolveCourseSubject } from "../../lib/content-client";
import { getLibraryUserKey, setActiveLibraryUserKey } from "../../lib/library";
import {
  CACHE_NAME,
  cacheTextUrls,
  migrateLegacyOfflineSubjects,
  writeOfflineSubjectMeta,
  type OfflineSubjectMeta,
} from "../../lib/offline";
import { buildPublicEntryUrl } from "../../lib/public-entry";
import {
  fetchTextStrict,
  normalize,
  parseSubjectTopicsFromReadme,
  toRawGithub,
} from "../../lib/readme-utils";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Prism),
  { ssr: false }
);

type CatalogTopic = {
  topic_name: string;
  md_url: string;
  section_markdown?: string;
  bullets?: string[];
};

type CatalogSubject = {
  subject: string;
  topics: CatalogTopic[];
};

const getSelectedTopic = (topics: CatalogTopic[], preferredTopicName: string) =>
  topics.find((topic) => normalize(topic.topic_name) === normalize(preferredTopicName)) ||
  topics[0] ||
  null;

async function readCachedText(url: string) {
  if (!("caches" in window)) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    return cached ? await cached.text() : null;
  } catch {
    return null;
  }
}

async function cacheTextContent(url: string, text: string) {
  if (!("caches" in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      url,
      new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  } catch {
    // ignore cache write failures
  }
}

async function fetchAndCacheText(url: string, signal: AbortSignal) {
  const fresh = await fetchTextStrict(url, signal);
  await cacheTextContent(url, fresh);
  return fresh;
}

export default function TopicPage() {
  const router = useRouter();
  const { topic, subject, readme } = router.query;
  const topicStr = String(topic || "");
  const subjectStr = String(subject || "");
  const readmeQuery = typeof readme === "string" ? readme : "";
  const { data: session, status } = useSession();
  const accountKey = useMemo(() => getLibraryUserKey(session?.user), [session]);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [catalogData, setCatalogData] = useState<CatalogSubject | null>(null);
  const [subjectReadmeUrl, setSubjectReadmeUrl] = useState("");
  const [subjectReadmeOutlineMd, setSubjectReadmeOutlineMd] = useState("");
  const [content, setContent] = useState("");
  const [mdBaseUrl, setMdBaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(buildPublicEntryUrl(router.asPath));
    }
  }, [router, status]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);

    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!accountKey) return;
    setActiveLibraryUserKey(accountKey);
    migrateLegacyOfflineSubjects(accountKey);
  }, [accountKey]);

  useEffect(() => {
    if (!router.isReady || !topicStr || !subjectStr) return;

    let cancelled = false;
    const controller = new AbortController();
    const offline = !navigator.onLine;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setContent("");
        setMdBaseUrl("");
        setSubjectReadmeOutlineMd("");

        let resolvedSubjectReadmeUrl = readmeQuery ? toRawGithub(readmeQuery) : "";

        if (!resolvedSubjectReadmeUrl) {
          const match = await resolveCourseSubject(subjectStr, controller.signal);
          if (!match) throw new Error("Subject not found in course catalog");
          resolvedSubjectReadmeUrl = toRawGithub(match.readme_url);
        }

        if (cancelled) return;
        setSubjectReadmeUrl(resolvedSubjectReadmeUrl);

        const subjectReadmeText = offline
          ? (await readCachedText(resolvedSubjectReadmeUrl)) || ""
          : await fetchAndCacheText(resolvedSubjectReadmeUrl, controller.signal);

        if (!subjectReadmeText) throw new Error("Subject README is empty or unavailable");

        const parsedTopics = parseSubjectTopicsFromReadme(
          subjectReadmeText,
          resolvedSubjectReadmeUrl
        ).map((item) => ({
          topic_name: item.topic_name,
          md_url: item.md_url,
          section_markdown: item.section_markdown,
          bullets: item.bullets,
        }));

        const catalog: CatalogSubject = {
          subject: subjectStr,
          topics: parsedTopics,
        };

        if (cancelled) return;
        setCatalogData(catalog);

        const selectedTopic = getSelectedTopic(catalog.topics, topicStr);
        if (!selectedTopic) throw new Error("No topics found for this subject");

        const outlineMd = (selectedTopic.section_markdown || "").trim();
        setSubjectReadmeOutlineMd(outlineMd);

        const mdUrl = toRawGithub(selectedTopic.md_url);
        const baseUrl = mdUrl.includes("/") ? mdUrl.slice(0, mdUrl.lastIndexOf("/") + 1) : "";

        let topicMd = "";
        if (offline) {
          topicMd = ((await readCachedText(mdUrl)) || "").trim();
        } else {
          try {
            topicMd = (await fetchAndCacheText(mdUrl, controller.signal)).trim();
          } catch {
            topicMd = "";
          }
        }

        if (cancelled) return;

        setMdBaseUrl(baseUrl);
        setContent(topicMd);
        setLoading(false);

        if (normalize(selectedTopic.topic_name) !== normalize(topicStr)) {
          void router.replace(
            {
              pathname: `/topic/${encodeURIComponent(selectedTopic.topic_name)}`,
              query: {
                subject: subjectStr,
                ...(resolvedSubjectReadmeUrl ? { readme: resolvedSubjectReadmeUrl } : {}),
              },
            },
            undefined,
            { shallow: true, scroll: false }
          );
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load topic content.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accountKey, readmeQuery, router, router.isReady, subjectStr, topicStr]);

  const topics = useMemo(() => catalogData?.topics ?? [], [catalogData]);

  const filteredTopics = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return topics;
    return topics.filter((item) => item.topic_name.toLowerCase().includes(query));
  }, [q, topics]);

  const activeTopic = useMemo(() => getSelectedTopic(topics, topicStr), [topicStr, topics]);
  const activeTopicName = activeTopic?.topic_name || topicStr;

  const currentIndex = useMemo(() => {
    if (!activeTopic) return -1;
    return topics.findIndex((item) => normalize(item.topic_name) === normalize(activeTopic.topic_name));
  }, [activeTopic, topics]);

  const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null;
  const nextTopic =
    currentIndex >= 0 && currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null;

  const saveOffline = async () => {
    if (!catalogData) return;

    const meta: OfflineSubjectMeta = {
      subject: subjectStr,
      savedAt: Date.now(),
      topicCount: catalogData.topics.length,
      topics: catalogData.topics,
      subject_readme_url: subjectReadmeUrl || undefined,
    };

    const urls = [
      ...(subjectReadmeUrl ? [subjectReadmeUrl] : []),
      ...catalogData.topics.map((item) => item.md_url),
    ];

    try {
      const cacheResult = await cacheTextUrls(urls, fetchTextStrict);
      const savedSubjectReadme =
        !subjectReadmeUrl || cacheResult.savedUrls.includes(toRawGithub(subjectReadmeUrl));

      if (!savedSubjectReadme || cacheResult.savedUrls.length === 0) {
        throw new Error("Could not save the required files for offline use.");
      }

      writeOfflineSubjectMeta(meta, accountKey);

      if (status === "authenticated") {
        await fetch("/api/offline-subjects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
          body: JSON.stringify(meta),
          cache: "no-store",
        }).catch(() => undefined);
      }

      if (cacheResult.failedUrls.length > 0) {
        window.alert(
          `Saved offline with ${cacheResult.failedUrls.length} skipped file(s). Some topic content may be limited offline.`
        );
        return;
      }

      window.alert(`Saved "${subjectStr}" for offline.`);
    } catch {
      window.alert("Offline save failed. Please try again while online.");
    }
  };

  const resolveImgSrc = (src: unknown): string => {
    if (!src || typeof src !== "string") return "";
    const value = src.trim();

    if (value.includes("github.com/") && value.includes("/blob/")) {
      return toRawGithub(value);
    }

    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("data:")) {
      return value;
    }

    if (!mdBaseUrl) return value;

    try {
      return new URL(value, mdBaseUrl).toString();
    } catch {
      return value;
    }
  };

  const markdownComponents: Components = {
    p({ children }) {
      return <p style={{ margin: "10px 0" }}>{children}</p>;
    },
    ul({ children }) {
      return <ul style={{ paddingLeft: 18, margin: "10px 0", listStyle: "disc" }}>{children}</ul>;
    },
    ol({ children }) {
      return <ol style={{ paddingLeft: 18, margin: "10px 0", listStyle: "decimal" }}>{children}</ol>;
    },
    li({ children }) {
      return <li style={{ marginBottom: 6 }}>{children}</li>;
    },
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const rawText =
        typeof children === "string"
          ? children
          : Array.isArray(children)
          ? children.join("")
          : String(children);
      const raw = rawText.replace(/\n$/, "");

      if (inline) return <code>{rawText}</code>;

      if (match) {
        return (
          <SyntaxHighlighter
            style={theme === "dark" ? materialDark : materialLight}
            language={match[1]}
            PreTag="div"
            wrapLongLines
            customStyle={{
              borderRadius: 14,
              padding: 14,
              fontSize: 13,
              maxWidth: "100%",
              overflowX: "auto",
            }}
            {...props}
          >
            {raw}
          </SyntaxHighlighter>
        );
      }

      return (
        <pre style={{ maxWidth: "100%", overflowX: "auto" }}>
          <code>{raw}</code>
        </pre>
      );
    },
    img({ src = "", alt = "" }: any) {
      const finalSrc = resolveImgSrc(src);
      if (!finalSrc) return null;

      return (
        <div className="md-image-wrapper">
          <img src={finalSrc} alt={alt} loading="lazy" />
        </div>
      );
    },
    table({ children }) {
      return (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table>{children}</table>
        </div>
      );
    },
  };

  const renderedMarkdown = useMemo(() => {
    const topicMd = (content || "").trim();
    const outlineMd = (subjectReadmeOutlineMd || "").trim();

    if (topicMd && outlineMd) {
      return `## Quick Outline\n\n${outlineMd}\n\n---\n\n${topicMd}`;
    }

    if (topicMd) return topicMd;
    if (outlineMd) return `# ${activeTopicName}\n\n${outlineMd}`;

    return `# ${activeTopicName}\n\nContent is being prepared for this topic.`;
  }, [activeTopicName, content, subjectReadmeOutlineMd]);

  return (
    <div className="app-shell">
      <main className="page-main">
        <div className="card page-hero-card">
          <div className="page-hero-top">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>TOPIC READER</div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                {activeTopicName || "Loading topic..."}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                {subjectStr} · {isOffline ? "Offline" : "Online"}
              </div>
            </div>

            <div className="page-hero-actions">
              <Link
                href={
                  subjectReadmeUrl
                    ? `/subject/${encodeURIComponent(subjectStr)}?readme=${encodeURIComponent(
                        subjectReadmeUrl
                      )}`
                    : `/subject/${encodeURIComponent(subjectStr)}`
                }
                className="btn btn-outline"
              >
                <FaArrowLeft /> Subject
              </Link>
              <Link href="/dashboard" className="btn btn-outline">
                <FaHome />
              </Link>
              <button className="btn btn-outline" onClick={saveOffline} type="button">
                <FaDownload /> Save Offline
              </button>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18 }}>
            Loading topic content...
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18, color: "crimson" }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: isDesktop ? "300px minmax(0, 1fr)" : "1fr",
              gap: 16,
            }}
          >
            <aside className="card" style={{ padding: 16, borderRadius: 22, minWidth: 0 }}>
              <div className="card" style={{ padding: "10px 12px", borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FaSearch />
                  <input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Search topics..."
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--text)",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {filteredTopics.map((item) => {
                  const isActive = normalize(item.topic_name) === normalize(activeTopicName);
                  const href = subjectReadmeUrl
                    ? `/topic/${encodeURIComponent(item.topic_name)}?subject=${encodeURIComponent(
                        subjectStr
                      )}&readme=${encodeURIComponent(subjectReadmeUrl)}`
                    : `/topic/${encodeURIComponent(item.topic_name)}?subject=${encodeURIComponent(
                        subjectStr
                      )}`;

                  return (
                    <Link
                      key={`${item.topic_name}-${item.md_url}`}
                      href={href}
                      className={isActive ? "btn btn-primary" : "btn btn-outline"}
                      style={{ justifyContent: "flex-start" }}
                    >
                      {item.topic_name}
                    </Link>
                  );
                })}
              </div>
            </aside>

            <section className="card" style={{ padding: 22, borderRadius: 22, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
                    {subjectStr}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900 }}>
                    {activeTopicName}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Link
                    href={
                      prevTopic
                        ? subjectReadmeUrl
                          ? `/topic/${encodeURIComponent(prevTopic.topic_name)}?subject=${encodeURIComponent(
                              subjectStr
                            )}&readme=${encodeURIComponent(subjectReadmeUrl)}`
                          : `/topic/${encodeURIComponent(prevTopic.topic_name)}?subject=${encodeURIComponent(
                              subjectStr
                            )}`
                        : "#"
                    }
                    className="btn btn-outline"
                    style={{ opacity: prevTopic ? 1 : 0.45, pointerEvents: prevTopic ? "auto" : "none" }}
                  >
                    <FaChevronLeft /> Prev
                  </Link>
                  <Link
                    href={
                      nextTopic
                        ? subjectReadmeUrl
                          ? `/topic/${encodeURIComponent(nextTopic.topic_name)}?subject=${encodeURIComponent(
                              subjectStr
                            )}&readme=${encodeURIComponent(subjectReadmeUrl)}`
                          : `/topic/${encodeURIComponent(nextTopic.topic_name)}?subject=${encodeURIComponent(
                              subjectStr
                            )}`
                        : "#"
                    }
                    className="btn btn-outline"
                    style={{ opacity: nextTopic ? 1 : 0.45, pointerEvents: nextTopic ? "auto" : "none" }}
                  >
                    Next <FaChevronRight />
                  </Link>
                </div>
              </div>

              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {renderedMarkdown}
                </ReactMarkdown>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export { requireAuthenticatedPage as getServerSideProps } from "../../lib/require-auth-page";
