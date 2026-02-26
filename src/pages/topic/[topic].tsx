// File: src/pages/topic/[topic].tsx
"use client";

import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThemeContext } from "../../context/ThemeContext";

import {
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaHome,
  FaDownload,
  FaMoon,
  FaSun,
  FaSearch,
} from "react-icons/fa";

import { materialLight, materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

import {
  normalize,
  parseMainCatalogReadme,
  parseSubjectTopicsFromReadme, // ✅ add this
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

type CatalogSubject = { subject: string; topics: CatalogTopic[] };

// ✅ Main catalog README (subject list)
const README_BLOB_URL =
  "https://github.com/tinitiateprime/tinitiate_it_traning_app/blob/main/README.md";
const README_RAW_URL = toRawGithub(README_BLOB_URL);
const CACHE_NAME = "tinitiate-offline-v1";

// ✅ Robust fetch: try direct, fallback to same-origin proxy
async function fetchText(url: string, signal?: AbortSignal) {
  try {
    const r = await fetch(url, { cache: "no-store", signal });
    if (r.ok) return await r.text();
  } catch {}

  const r2 = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
    cache: "no-store",
    signal,
  });
  if (!r2.ok) throw new Error(`Fetch failed (HTTP ${r2.status})`);
  return await r2.text();
}

// ✅ cache-first text loader (for README / subject README / markdown)
async function loadTextCacheFirst(url: string, signal: AbortSignal) {
  let cachedText: string | null = null;

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) cachedText = await cached.text();
    } catch {}
  }

  const result: { cached: string | null; fresh: string | null } = {
    cached: cachedText,
    fresh: null,
  };

  try {
    const fresh = await fetchText(url, signal);
    result.fresh = fresh;

    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(
          url,
          new Response(fresh, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      } catch {}
    }
  } catch {
    // ignore network failure
  }

  return result;
}

/** ✅ fallback markdown if file is empty */
function getFallbackMarkdown(subject: string, topic: string) {
  return `# ${topic}

This page is still being prepared.

## What you can add here
- Explanation of the concept
- One practical example
- Common mistakes + best practices

> Subject: ${subject}
`;
}

export default function TopicPage() {
  const router = useRouter();
  const { topic, subject, readme } = router.query;

  const topicStr = String(topic || "");
  const subjectStr = String(subject || "");
  const readmeQuery = typeof readme === "string" ? readme : "";

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [catalogData, setCatalogData] = useState<CatalogSubject | null>(null);

  const [subjectReadmeUrl, setSubjectReadmeUrl] = useState<string>("");
  const [subjectReadmeOutlineMd, setSubjectReadmeOutlineMd] = useState<string>("");

  const [content, setContent] = useState("");
  const [mdBaseUrl, setMdBaseUrl] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  // ✅ responsive (no tailwind needed)
  const [isDesktop, setIsDesktop] = useState(false);

  // ✅ Desktop sidebar open/close
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ✅ mobile drawer only
  const [mobileOpen, setMobileOpen] = useState(false);

  const [q, setQ] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // detect desktop
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);

    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // when going desktop, force-close mobile drawer
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // ✅ prevent stale state when switching between mobile/desktop
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(true);
  }, [isDesktop]);

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

  // ✅ load catalog + subject README + topic markdown
  useEffect(() => {
    if (!router.isReady) return;
    if (!topicStr || !subjectStr) return;

    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        setSubjectReadmeOutlineMd("");

        // 1) Resolve subject README URL
        let resolvedSubjectReadmeUrl = "";

        if (readmeQuery) {
          resolvedSubjectReadmeUrl = toRawGithub(readmeQuery);
        } else {
          const mainRes = await loadTextCacheFirst(README_RAW_URL, ac.signal);
          const mainMd = mainRes.fresh || mainRes.cached || "";

          const mainSubjects = parseMainCatalogReadme(mainMd);
          const match = mainSubjects.find(
            (s) => normalize(s.subject) === normalize(subjectStr)
          );

          if (!match) throw new Error("Subject not found in main README");

          resolvedSubjectReadmeUrl = toRawGithub(match.readme_url);
        }

        if (cancelled) return;
        setSubjectReadmeUrl(resolvedSubjectReadmeUrl);

        // 2) Load subject README (the one that contains topic links + bullets)
        const subjectRes = await loadTextCacheFirst(resolvedSubjectReadmeUrl, ac.signal);
        const subjectReadmeText = subjectRes.fresh || subjectRes.cached || "";
        if (!subjectReadmeText) throw new Error("Subject README empty or unavailable");

        const parsedTopics = parseSubjectTopicsFromReadme(
          subjectReadmeText,
          resolvedSubjectReadmeUrl
        );

        const catalog: CatalogSubject = {
          subject: subjectStr,
          topics: parsedTopics.map((t) => ({
            topic_name: t.topic_name,
            md_url: t.md_url,
            section_markdown: t.section_markdown,
            bullets: t.bullets,
          })),
        };

        if (cancelled) return;
        setCatalogData(catalog);

        // 3) Find current topic from parsed subject README
        const found = catalog.topics.find(
          (t) => normalize(t.topic_name) === normalize(topicStr)
        );
        if (!found) throw new Error("Topic not found in subject README");

        // ✅ Save bullet/outline markdown from subject README section
        setSubjectReadmeOutlineMd((found.section_markdown || "").trim());

        // 4) Load actual topic markdown file
        const mdUrl = toRawGithub(found.md_url);
        const base = mdUrl.slice(0, mdUrl.lastIndexOf("/") + 1);
        setMdBaseUrl(base);

        let topicMd = "";
        try {
          const topicRes = await loadTextCacheFirst(mdUrl, ac.signal);
          topicMd = topicRes.fresh || topicRes.cached || "";
        } catch {
          // If topic file fetch fails but README outline exists, don't fail the whole page
          topicMd = "";
        }

        if (cancelled) return;

        setContent(topicMd || "");
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Failed to load content");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [router.isReady, topicStr, subjectStr, readmeQuery]);

  const topics = catalogData?.topics ?? [];

  const filteredTopics = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return topics;
    return topics.filter((t) => t.topic_name.toLowerCase().includes(qq));
  }, [topics, q]);

  const currentIndex = useMemo(
    () => topics.findIndex((t) => normalize(t.topic_name) === normalize(topicStr)),
    [topics, topicStr]
  );

  const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null;
  const nextTopic =
    currentIndex >= 0 && currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null;

  const saveOffline = async () => {
    if (!catalogData || !("serviceWorker" in navigator)) {
      alert("Service Worker not supported");
      return;
    }

    const urls = [
      README_RAW_URL,
      ...(subjectReadmeUrl ? [subjectReadmeUrl] : []),
      ...catalogData.topics.map((t) => toRawGithub(t.md_url)),
    ];

    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "PREFETCH_URLS", urls });

    alert(`Saved "${subjectStr}" for offline ✅`);
  };

  const resolveImgSrc = (src: unknown): string => {
    if (!src || typeof src !== "string") return "";
    let s = src.trim();

    if (s.includes("github.com/") && s.includes("/blob/")) s = toRawGithub(s);

    if (s.startsWith("http") || s.startsWith("/") || s.startsWith("data:")) return s;

    if (!mdBaseUrl) return s;
    try {
      return new URL(s, mdBaseUrl).toString();
    } catch {
      return s;
    }
  };

  // ✅ markdown styling
  const markdownComponents: Components = {
    ul({ children }: any) {
      return <ul style={{ paddingLeft: 18, margin: "10px 0", listStyle: "disc" }}>{children}</ul>;
    },
    ol({ children }: any) {
      return <ol style={{ paddingLeft: 18, margin: "10px 0", listStyle: "decimal" }}>{children}</ol>;
    },
    li({ children }: any) {
      return <li style={{ marginBottom: 6 }}>{children}</li>;
    },
    p({ children }: any) {
      return <p style={{ margin: "10px 0" }}>{children}</p>;
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
      const key = `${match?.[1] ?? "text"}:${raw.slice(0, 80)}`;

      if (inline) return <code>{rawText}</code>;

      if (match) {
        const onCopy = async () => {
          try {
            await navigator.clipboard.writeText(raw);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1200);
          } catch {
            const ta = document.createElement("textarea");
            ta.value = raw;
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1200);
          }
        };

        return (
          <div style={{ position: "relative", maxWidth: "100%", overflowX: "auto" }}>
            <button
              type="button"
              onClick={onCopy}
              className="btn btn-outline"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 10,
                zIndex: 2,
                backdropFilter: "blur(6px)",
              }}
            >
              {copiedKey === key ? "Copied!" : "Copy"}
            </button>

            <SyntaxHighlighter
              style={theme === "dark" ? materialDark : materialLight}
              language={match[1]}
              PreTag="div"
              wrapLongLines
              customStyle={{
                borderRadius: "14px",
                padding: "14px",
                paddingTop: "44px",
                fontSize: "13px",
                maxWidth: "100%",
                overflowX: "auto",
              }}
              {...props}
            >
              {raw}
            </SyntaxHighlighter>
          </div>
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

    table({ children }: any) {
      return (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table>{children}</table>
        </div>
      );
    },
  };

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <img src="/favicon_new.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 10 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subjectStr.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {isOffline ? "Offline" : "Online"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          href={
            subjectReadmeUrl
              ? `/subject/${encodeURIComponent(subjectStr)}?readme=${encodeURIComponent(subjectReadmeUrl)}`
              : `/subject/${encodeURIComponent(subjectStr)}`
          }
          onClick={onNavigate}
          className="btn btn-outline"
        >
          <FaArrowLeft /> Back
        </Link>

        <Link href="/dashboard" onClick={onNavigate} className="btn btn-outline" aria-label="Home">
          <FaHome />
        </Link>
        
      </div>

      <div className="card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics…"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text)",
          }}
        />
      </div>

      <div className="soft" style={{ padding: 8, overflowY: "auto", flex: 1 }}>
        {filteredTopics.map((t) => {
          const active = normalize(t.topic_name) === normalize(topicStr);
          const href = subjectReadmeUrl
            ? `/topic/${encodeURIComponent(t.topic_name)}?subject=${encodeURIComponent(
                subjectStr
              )}&readme=${encodeURIComponent(subjectReadmeUrl)}`
            : `/topic/${encodeURIComponent(t.topic_name)}?subject=${encodeURIComponent(subjectStr)}`;

          return (
            <Link
              key={`${t.topic_name}-${t.md_url}`}
              href={href}
              onClick={onNavigate}
              style={{
                display: "block",
                padding: "10px 10px",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
                fontWeight: active ? 900 : 600,
                background: active ? "rgba(37,99,235,0.10)" : "transparent",
                border: active ? "1px solid rgba(37,99,235,0.25)" : "1px solid transparent",
                marginBottom: 4,
              }}
            >
              {t.topic_name}
            </Link>
          );
        })}

        <button className="btn btn-primary" onClick={saveOffline} type="button" style={{ width: "100%", marginTop: 8 }}>
          <FaDownload /> Save Offline
        </button>
      </div>
    </div>
  );

  const CollapsedRail = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <button className="btn btn-outline" onClick={() => setSidebarOpen(true)} type="button" aria-label="Expand sidebar">
        <FaChevronRight />
      </button>

      <Link
        href={
          subjectReadmeUrl
            ? `/subject/${encodeURIComponent(subjectStr)}?readme=${encodeURIComponent(subjectReadmeUrl)}`
            : `/subject/${encodeURIComponent(subjectStr)}`
        }
        className="btn btn-outline"
        aria-label="Back"
      >
        <FaArrowLeft />
      </Link>

      <Link href="/" className="btn btn-outline" aria-label="Home">
        <FaHome />
      </Link>

      <button className="btn btn-outline" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </button>
    </div>
  );

  // ✅ Combine README bullet-outline + actual topic markdown
  const renderedMarkdown = useMemo(() => {
    const topicMd = (content || "").trim();
    const outlineMd = (subjectReadmeOutlineMd || "").trim();

    if (topicMd && outlineMd) {
      return `## Quick Outline (from ${subjectStr} README)

${outlineMd}

---

${topicMd}`;
    }

    if (topicMd) return topicMd;

    if (outlineMd) {
      return `# ${topicStr}

${outlineMd}`;
    }

    return getFallbackMarkdown(subjectStr, topicStr);
  }, [content, subjectReadmeOutlineMd, subjectStr, topicStr]);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* HEADER (sticky) */}
     {/* HEADER (sticky) */}
<div
  className="card"
  style={{
    borderRadius: 0,
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    position: "sticky",
    top: 0,
    zIndex: 80,
  }}
>
  <div
    style={{
      maxWidth: 1400,
      margin: "0 auto",
      padding: "12px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}
  >
    {/* top row */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "1fr auto 1fr" : "auto 1fr auto",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* left side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "flex-start",
          minWidth: 0,
        }}
      >
        {!isDesktop && (
          <button
            className="btn btn-outline"
            onClick={() => setMobileOpen(true)}
            type="button"
            aria-label="Open sidebar"
            style={{ padding: "8px 10px" }}
          >
            <span style={{ fontSize: 14 }}>
              <FaBars />
            </span>
          </button>
        )}

        {/* mobile title: left beside burger */}
        {!isDesktop && (
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {topicStr || (loading ? "Loading…" : "")}
            </div>
          </div>
        )}
      </div>

      {/* desktop title: centered */}
      {isDesktop ? (
        <div
          style={{
            minWidth: 0,
            textAlign: "center",
            justifySelf: "center",
            maxWidth: "70vw",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {topicStr || (loading ? "Loading…" : "")}
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* right side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Link
          className="btn btn-outline"
          href={
            subjectStr
              ? subjectReadmeUrl
                ? `/subject/${encodeURIComponent(subjectStr)}?readme=${encodeURIComponent(subjectReadmeUrl)}`
                : `/subject/${encodeURIComponent(subjectStr)}`
              : "#"
          }
          aria-label="Subject Home"
          style={{
            opacity: subjectStr ? 1 : 0.5,
            pointerEvents: subjectStr ? "auto" : "none",
          }}
        >
          <FaHome />
        </Link>

        <button
          className="btn btn-outline"
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
        >
          <span style={{ fontSize: 14 }}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </span>
        </button>
      </div>
    </div>

    {/* bottom row: prev / next */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Link
        className="btn btn-outline"
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
        style={{ opacity: prevTopic ? 1 : 0.5, pointerEvents: prevTopic ? "auto" : "none" }}
        aria-label="Previous topic"
      >
        <FaChevronLeft />
      </Link>

      <Link
        className="btn btn-outline"
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
        style={{ opacity: nextTopic ? 1 : 0.5, pointerEvents: nextTopic ? "auto" : "none" }}
        aria-label="Next topic"
      >
        <FaChevronRight />
      </Link>
    </div>
  </div>
</div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {/* ✅ DESKTOP ONLY sidebar */}
          {isDesktop && (
            <aside
              className="card"
              style={{
                width: sidebarOpen ? 320 : 70,
                overflow: "hidden",
                transition: "width 180ms ease",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignSelf: "stretch",
                position: "relative",
              }}
            >
              {sidebarOpen && (
                <button
                  className="btn btn-outline"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 10,
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    padding: 0,
                  }}
                  aria-label="Collapse sidebar"
                  type="button"
                >
                  <FaChevronLeft />
                </button>
              )}

              {sidebarOpen ? <Sidebar /> : <CollapsedRail />}
            </aside>
          )}

          <main className="card" style={{ flex: 1, padding: 14, minWidth: 0 }}>
            {loading && <div style={{ color: "var(--muted)" }}>Loading content…</div>}
            {!loading && error && <div style={{ color: "crimson" }}>{error}</div>}
            {!loading && !error && (
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {renderedMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ✅ MOBILE DRAWER */}
      {!isDesktop && mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: theme === "dark" ? "rgba(2,6,23,0.55)" : "rgba(15,23,42,0.25)",
            backdropFilter: "blur(6px)",
            display: "flex",
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="card"
            style={{
              width: "86vw",
              maxWidth: 360,
              height: "100%",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flex: "0 0 auto" }}>
              <div style={{ fontWeight: 900 }}>Topics</div>
              <button className="btn btn-outline" onClick={() => setMobileOpen(false)} type="button" aria-label="Close sidebar">
                <FaTimes />
              </button>
            </div>

            <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}