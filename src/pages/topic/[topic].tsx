"use client";

import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
  FaFont,
} from "react-icons/fa";

import {
  materialLight,
  materialDark,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Prism),
  { ssr: false }
);

type CatalogTopic = { topic_name: string; md_url: string };
type CatalogSubject = { subject: string; topics: CatalogTopic[] };

type FontKey = "Serif" | "Sans" | "Mono" | "Literary" | "Editorial";

const FONT_KEY_STORAGE = "global_font_style_v1";

const FONT_FAMILIES: Record<FontKey, string> = {
  Serif: `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`,
  Sans: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`,
  Mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
  Literary: `"Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif`,
  Editorial: `Charter, "Baskerville", "Libre Baskerville", "Times New Roman", serif`,
};

const MONO_STACK = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

export default function TopicPage() {
  const router = useRouter();
  const { topic, subject } = router.query;

  const topicStr = String(topic || "");
  const subjectStr = String(subject || "");

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [catalogData, setCatalogData] = useState<CatalogSubject | null>(null);
  const [content, setContent] = useState("");
  const [mdBaseUrl, setMdBaseUrl] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // drawer
  const [q, setQ] = useState("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ✅ Global font control (markdown only)
  const [fontKey, setFontKey] = useState<FontKey>("Sans");
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // online/offline badge
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
    // restore font
    try {
      const saved = localStorage.getItem(FONT_KEY_STORAGE);
      if (saved && ["Serif", "Sans", "Mono", "Literary", "Editorial"].includes(saved)) {
        setFontKey(saved as FontKey);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // persist font
    try {
      localStorage.setItem(FONT_KEY_STORAGE, fontKey);
    } catch {}
  }, [fontKey]);

  useEffect(() => {
    // close font dropdown on outside click
    const onDown = (e: MouseEvent) => {
      if (!fontMenuOpen) return;
      const target = e.target as Node;
      if (fontMenuRef.current && !fontMenuRef.current.contains(target)) {
        setFontMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [fontMenuOpen]);

  useEffect(() => {
    if (!router.isReady || !topic || !subject) return;

    setLoading(true);
    setError("");

    const catalogUrl =
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

    fetch(catalogUrl)
      .then((res) => res.json())
      .then((data: { qna_catalog: CatalogSubject[] }) => {
        const catalog = data.qna_catalog.find(
          (s) => s.subject.toLowerCase() === subjectStr.toLowerCase()
        );
        if (!catalog) throw new Error("Subject not found");
        setCatalogData(catalog);

        const found = catalog.topics.find((t) => t.topic_name === topicStr);
        if (!found) throw new Error("Topic not found");

        const base = found.md_url.slice(0, found.md_url.lastIndexOf("/") + 1);
        setMdBaseUrl(base);

        return fetch(found.md_url);
      })
      .then((res) => res.text())
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load content");
        setLoading(false);
      });
  }, [router.isReady, topicStr, subjectStr, topic, subject]);

  const topics = catalogData?.topics ?? [];

  const filteredTopics = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return topics;
    return topics.filter((t) => t.topic_name.toLowerCase().includes(qq));
  }, [topics, q]);

  const currentIndex = useMemo(
    () => topics.findIndex((t) => t.topic_name === topicStr),
    [topics, topicStr]
  );

  const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null;
  const nextTopic =
    currentIndex >= 0 && currentIndex < topics.length - 1
      ? topics[currentIndex + 1]
      : null;

  const saveOffline = async () => {
    if (!catalogData || !("serviceWorker" in navigator))
      return alert("Service Worker not supported");

    const urls = [
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json",
      ...catalogData.topics.map((t) => t.md_url),
    ];

    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "PREFETCH_URLS", urls });
    alert(`Saved "${subjectStr}" for offline ✅`);
  };

  const toRawGithub = (u: string) => {
    const m = u.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
    );
    if (!m) return u;
    const [, owner, repo, branch, p] = m;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${p}`;
  };

  const resolveImgSrc = (src: unknown): string => {
    if (!src || typeof src !== "string") return "";
    let s = src.trim();

    if (s.includes("github.com/") && s.includes("/blob/")) {
      s = toRawGithub(s);
    }

    if (s.startsWith("http") || s.startsWith("/") || s.startsWith("data:")) return s;

    if (!mdBaseUrl) return s;
    try {
      return new URL(s, mdBaseUrl).toString();
    } catch {
      return s;
    }
  };

  const markdownComponents: Components = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const raw = String(children).replace(/\n$/, "");
      const key = `${match?.[1] ?? "text"}:${raw.slice(0, 80)}`;

      // ✅ inline code should NOT change with font dropdown
      if (inline) {
        return <code style={{ fontFamily: MONO_STACK }}>{children}</code>;
      }

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
                fontFamily: MONO_STACK,
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
          <code style={{ fontFamily: MONO_STACK }}>{children}</code>
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <img
            src="/favicon_new.png"
            alt="Logo"
            style={{ width: 32, height: 32, borderRadius: 10 }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 900,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subjectStr.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {isOffline ? "Offline" : "Online"}
            </div>
          </div>
        </div>

        {/* ✅ Theme button + Sidebar toggle under it (NO OVERLAY) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn btn-outline" onClick={toggleTheme} type="button" aria-label="Toggle theme">
            <span style={{ fontSize: 14 }}>{theme === "dark" ? <FaSun /> : <FaMoon />}</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Collapse sidebar"
          >
            <FaChevronLeft />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          href={`/subject/${encodeURIComponent(subjectStr)}`}
          onClick={onNavigate}
          className="btn btn-outline"
        >
          <FaArrowLeft /> Back
        </Link>
        <Link href="/" onClick={onNavigate} className="btn btn-outline" aria-label="Home">
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
          const active = t.topic_name === topicStr;
          return (
            <Link
              key={t.topic_name}
              href={`/topic/${encodeURIComponent(t.topic_name)}?subject=${encodeURIComponent(subjectStr)}`}
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

        <button
          className="btn btn-primary"
          onClick={saveOffline}
          type="button"
          style={{ width: "100%", marginTop: 8 }}
        >
          <FaDownload /> Save Offline
        </button>
      </div>
    </div>
  );

  const CollapsedRail = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      {/* ✅ Theme first */}
      <button className="btn btn-outline" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </button>

      {/* ✅ Open/close toggle UNDER theme (as requested) */}
      <button className="btn btn-outline" onClick={() => setSidebarOpen(true)} type="button" aria-label="Expand sidebar">
        <FaChevronRight />
      </button>

      <Link href={`/subject/${encodeURIComponent(subjectStr)}`} className="btn btn-outline" aria-label="Back">
        <FaArrowLeft />
      </Link>
      <Link href="/" className="btn btn-outline" aria-label="Home">
        <FaHome />
      </Link>
    </div>
  );

  const FontButton = () => (
    <div ref={fontMenuRef} style={{ position: "relative" }}>
      <button
        className="btn btn-outline"
        type="button"
        aria-label="Font style"
        onClick={() => setFontMenuOpen((v) => !v)}
        style={{ padding: "8px 10px" }}
      >
        <FaFont />
      </button>

      {fontMenuOpen && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 60,
            padding: 8,
            minWidth: 180,
            borderRadius: 14,
          }}
        >
          {(["Serif", "Sans", "Mono", "Literary", "Editorial"] as FontKey[]).map((k) => {
            const active = k === fontKey;
            return (
              <button
                key={k}
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setFontKey(k);
                  setFontMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontFamily: FONT_FAMILIES[k],
                  fontWeight: active ? 900 : 700,
                  opacity: active ? 1 : 0.9,
                }}
              >
                <span>{k}</span>
                {active ? <span aria-hidden>✓</span> : <span aria-hidden style={{ opacity: 0.3 }}>•</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const prevHref = prevTopic
    ? `/topic/${encodeURIComponent(prevTopic.topic_name)}?subject=${encodeURIComponent(subjectStr)}`
    : "#";

  const nextHref = nextTopic
    ? `/topic/${encodeURIComponent(nextTopic.topic_name)}?subject=${encodeURIComponent(subjectStr)}`
    : "#";

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* HEADER */}
      <div className="card" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
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
          {/* Top row (like screenshot) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Logo (small square button like screenshot) */}
              <Link
                href="/"
                className="btn btn-primary"
                aria-label="Home"
                style={{
                  width: 36,
                  height: 36,
                  padding: 0,
                  borderRadius: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                }}
              >
                TI
              </Link>

              {/* MOBILE HAMBURGER */}
              <button
                className="btn btn-outline lg:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
                aria-label="Open sidebar"
                style={{ padding: "8px 10px" }}
              >
                <span style={{ fontSize: 14 }}>
                  <FaBars />
                </span>
              </button>

              {/* DESKTOP TOGGLE (keep) */}
              <button
                className="btn btn-outline hidden lg:inline-flex"
                onClick={() => setSidebarOpen((v) => !v)}
                type="button"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
              </button>

              {/* Home icon like screenshot */}
              <Link href="/" className="btn btn-outline" aria-label="Home" style={{ padding: "8px 10px" }}>
                <FaHome />
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontWeight: 800,
                }}
                title={isOffline ? "Offline" : "Online"}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: isOffline ? "orange" : "limegreen" }} />
                {isOffline ? "Offline" : "Online"}
              </span>

              {/* ✅ Font button BEFORE theme button */}
              <FontButton />

              <button className="btn btn-outline" onClick={toggleTheme} type="button" aria-label="Toggle theme" style={{ padding: "8px 10px" }}>
                <span style={{ fontSize: 14 }}>{theme === "dark" ? <FaSun /> : <FaMoon />}</span>
              </button>
            </div>
          </div>

          {/* Second row: Prev (left) + Center title + Next (right) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Link
              className="btn btn-outline"
              href={prevHref}
              style={{
                opacity: prevTopic ? 1 : 0.5,
                pointerEvents: prevTopic ? "auto" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 12,
              }}
              aria-disabled={!prevTopic}
            >
              <FaChevronLeft />
              Prev
            </Link>

            <div style={{ textAlign: "center", minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900, letterSpacing: 0.6 }}>
                {currentIndex >= 0 && topics.length > 0
                  ? `TOPIC ${currentIndex + 1} OF ${topics.length}`
                  : loading
                  ? "LOADING…"
                  : ""}
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 20,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "70vw",
                }}
              >
                {topicStr || (loading ? "Loading…" : "")}
              </div>
            </div>

            <Link
              className="btn btn-outline"
              href={nextHref}
              style={{
                opacity: nextTopic ? 1 : 0.5,
                pointerEvents: nextTopic ? "auto" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 12,
              }}
              aria-disabled={!nextTopic}
            >
              Next
              <FaChevronRight />
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {/* DESKTOP SIDEBAR */}
          <aside
            className="card hidden lg:flex"
            style={{
              width: sidebarOpen ? 320 : 70,
              overflow: "hidden",
              transition: "width 180ms ease",
              padding: 12,
              flexDirection: "column",
              alignSelf: "stretch",
            }}
          >
            {sidebarOpen ? <Sidebar /> : <CollapsedRail />}
          </aside>

          {/* CONTENT */}
          <main className="card" style={{ flex: 1, padding: 14, minWidth: 0 }}>
            {loading && <div style={{ color: "var(--muted)" }}>Loading content…</div>}
            {!loading && error && <div style={{ color: "crimson" }}>{error}</div>}
            {!loading && !error && (
              // ✅ Apply font ONLY to markdown (not code blocks)
              <div className="prose" style={{ fontFamily: FONT_FAMILIES[fontKey] }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div
          className="card lg:hidden"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "86vw",
            maxWidth: 360,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              flex: "0 0 auto",
            }}
          >
            <div style={{ fontWeight: 900 }}>Topics</div>
            <button className="btn btn-outline" onClick={() => setMobileOpen(false)} type="button">
              <FaTimes />
            </button>
          </div>

          <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
