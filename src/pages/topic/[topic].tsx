"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./TopicPage.module.css";

type TopicMap = { [key: string]: string };
type Theme = "light" | "dark";

function normalizeRawUrl(url: string) {
  return String(url).replace(
    "https://raw.github.com/",
    "https://raw.githubusercontent.com/"
  );
}

function baseFromRawUrl(rawFileUrl: string) {
  const u = normalizeRawUrl(rawFileUrl);
  const idx = u.lastIndexOf("/");
  return idx >= 0 ? u.slice(0, idx + 1) : u;
}

// repo-root for handling "/assets/..." paths inside markdown
// raw url format: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/path/file.md
function repoRootFromRaw(rawFileUrl: string) {
  const u = normalizeRawUrl(rawFileUrl);
  const parts = u.split("/");
  if (parts.length >= 6) return parts.slice(0, 6).join("/") + "/";
  return baseFromRawUrl(u);
}

function toRawIfGithubBlob(url: string) {
  if (/^https?:\/\/github\.com\/.+\/blob\//i.test(url)) {
    return url
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/blob/", "/");
  }
  return url;
}

function normMdName(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/^\d+[-_]?/, "")
    .replace(/[^a-z0-9]/g, "");
}

// clean slug from markdown file name (01-introduction.md -> introduction)
function toSlugFromMd(file: string) {
  return String(file)
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/\.md$/i, "")
    .replace(/^\d+[-_]?/i, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// clean slug from title ("Getting Started" -> getting-started)
function toSlugFromTitle(title: string) {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// display title from md filename OR slug (01-introduction.md OR introduction -> Introduction)
function prettyTitleFromMdOrSlug(s: string) {
  const clean = String(s)
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/\.md$/i, "")
    .replace(/^\d+[-_]?/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/-+/g, " ")
    .trim();

  if (!clean) return "Topic";
  if (clean.toLowerCase() === "readme") return "README";

  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

// extract plain text from React children
function plainText(children: any): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (children?.props?.children) return plainText(children.props.children);
  return "";
}

// ✅ remove first markdown H1 to avoid duplicate page title
function stripFirstMarkdownH1(md: string) {
  if (!md) return md;
  // remove first "# Title" line only if it is at the start (allow empty lines before)
  return md.replace(/^\s*#\s+.+\n+/m, "");
}

export default function TopicPage() {
  const router = useRouter();
  const { subject, topic } = router.query;

  const subjectStr = Array.isArray(subject) ? subject[0] : subject;
  const topicStr = Array.isArray(topic) ? topic[0] : topic;

  const [topics, setTopics] = useState<TopicMap>({});
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [theme, setTheme] = useState<Theme>("light");

  // hydration fix
  const [mounted, setMounted] = useState(false);

  // subject might be missing when clicking markdown links
  const [effectiveSubject, setEffectiveSubject] = useState<string | null>(null);

  // markdown images base
  const [mdBase, setMdBase] = useState("");
  const [mdRepoRoot, setMdRepoRoot] = useState("");

  const cacheKey = effectiveSubject ? `md-cache-${effectiveSubject}` : "";

  useEffect(() => setMounted(true), []);

  // init theme + subject AFTER mount
  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem("lp-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else {
      const prefersDark =
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    const last = localStorage.getItem("last-subject");
    if (!subjectStr && last) setEffectiveSubject(last);

    if (subjectStr) {
      setEffectiveSubject(subjectStr);
      localStorage.setItem("last-subject", subjectStr);
    }
  }, [mounted, subjectStr]);

  // load markdown content
  useEffect(() => {
    if (!mounted) return;
    if (!topicStr) return;

    const run = async () => {
      setError("");
      setContent("");

      // 1) cache
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as TopicMap;
            setTopics(parsed);

            // direct
            if (parsed[topicStr]) {
              setContent(parsed[topicStr]);
              requestAnimationFrame(() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              );
              return;
            }

            // slug match
            const want = normMdName(topicStr);
            const foundKey = Object.keys(parsed).find(
              (k) => normMdName(k) === want
            );
            if (foundKey && parsed[foundKey]) {
              setContent(parsed[foundKey]);
              requestAnimationFrame(() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              );
              return;
            }
          } catch {}
        }
      }

      // 2) fallback from /data.json
      try {
        const res = await fetch("../public/data.json");
        const data = await res.json();

        let subj =
          effectiveSubject ||
          subjectStr ||
          localStorage.getItem("last-subject");

        // discover subject by matching (key or file slug)
        if (!subj) {
          const want = normMdName(topicStr);
          for (const [subjKey, subjMap] of Object.entries<any>(
            data.subjects || {}
          )) {
            const urls = Object.values<string>(subjMap || {});
            const keys = Object.keys(subjMap || {});

            const keyMatch = keys.some((k) => normMdName(k) === want);
            const fileMatch = urls.some((u) => {
              const file = normalizeRawUrl(u).split("/").pop() || "";
              return normMdName(file) === want;
            });

            if (keyMatch || fileMatch) {
              subj = subjKey;
              setEffectiveSubject(subjKey);
              localStorage.setItem("last-subject", subjKey);
              break;
            }
          }
        }

        if (!subj) {
          setError("Open subject page first (subject missing).");
          return;
        }

        const subjMap = data.subjects?.[subj];
        if (!subjMap) {
          setError(`Subject "${subj}" not found in data.json`);
          return;
        }

        // sidebar list (titles)
        const names = Object.keys(subjMap);
        const temp: TopicMap = {};
        names.forEach((k) => (temp[k] = ""));
        setTopics(temp);

        // resolve markdown URL by slug
        const want = normMdName(topicStr);
        let resolvedUrl: string | null = null;

        for (const url of Object.values<string>(subjMap)) {
          const u = normalizeRawUrl(url);
          const file = u.split("/").pop() || "";
          if (normMdName(file) === want) {
            resolvedUrl = u;
            break;
          }
        }

        if (!resolvedUrl) {
          setError("Topic not found (no matching URL).");
          return;
        }

        // base for relative images
        setMdBase(baseFromRawUrl(resolvedUrl));
        setMdRepoRoot(repoRootFromRaw(resolvedUrl));

        const mdRes = await fetch(resolvedUrl);
        if (!mdRes.ok) throw new Error("Failed to fetch markdown");
        const md = await mdRes.text();

        setContent(md);

        // cache update (store under topicStr too)
        const ck = `md-cache-${subj}`;
        const cachedNow = localStorage.getItem(ck);
        const existing = cachedNow ? (JSON.parse(cachedNow) as TopicMap) : {};
        const updated = { ...existing, [topicStr]: md };
        localStorage.setItem(ck, JSON.stringify(updated));

        requestAnimationFrame(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load content.");
      }
    };

    run();
  }, [mounted, topicStr, cacheKey, effectiveSubject, subjectStr]);

  const topicKeys = useMemo(() => Object.keys(topics), [topics]);

  const filteredKeys = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topicKeys;
    return topicKeys.filter((k) => k.toLowerCase().includes(q));
  }, [query, topicKeys]);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("lp-theme", next);
      return next;
    });
  };

  // markdown links + images + clean URLs + pretty link text
  const mdComponents = useMemo(
    () => ({
      a: ({ href = "", children }: any) => {
        const h = String(href);
        const external = /^https?:\/\//i.test(h);

        const subj =
          effectiveSubject ||
          subjectStr ||
          (typeof window !== "undefined"
            ? localStorage.getItem("last-subject")
            : "") ||
          "";

        const clean = h.replace(/^\.\//, "").replace(/^\/+/, "");

        if (!external && clean.toLowerCase().endsWith(".md")) {
          const slug = toSlugFromMd(clean);
          const to = `/topic/${encodeURIComponent(slug)}${
            subj ? `?subject=${encodeURIComponent(subj)}` : ""
          }`;

          const txt = plainText(children).trim();
          const display =
            txt.toLowerCase() === clean.toLowerCase()
              ? prettyTitleFromMdOrSlug(clean)
              : children;

          return (
            <Link href={to} className={styles.mdLink}>
              {display}
            </Link>
          );
        }

        return (
          <a
            href={h}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {children}
          </a>
        );
      },

      img: ({ src = "", alt = "" }: any) => {
        let s = String(src || "").trim();
        const altText = String(alt || "").trim();

        // Vue Logo -> show your local icon
        if (altText.toLowerCase().includes("vue logo")) {
          return (
            <img
              src="/favicon_new.png"
              alt={altText || "Vue"}
              style={{ width: 64, height: 64, objectFit: "contain" }}
              loading="lazy"
            />
          );
        }

        if (!s) return null;

        s = toRawIfGithubBlob(s);
        s = normalizeRawUrl(s);

        let finalSrc = s;

        if (finalSrc.startsWith("//")) {
          finalSrc = "https:" + finalSrc;
        } else if (/^https?:\/\//i.test(finalSrc) || finalSrc.startsWith("data:")) {
          // ok
        } else if (finalSrc.startsWith("/")) {
          if (mdRepoRoot) finalSrc = mdRepoRoot + finalSrc.slice(1);
        } else {
          if (mdBase) {
            try {
              finalSrc = new URL(finalSrc, mdBase).toString();
            } catch {
              finalSrc = mdBase + finalSrc.replace(/^\.\//, "");
            }
          }
        }

        finalSrc = finalSrc.replace(/ /g, "%20");

        return (
          <img
            src={finalSrc}
            alt={altText}
            style={{ maxWidth: "100%", height: "auto", borderRadius: 12 }}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/favicon_new.png";
            }}
          />
        );
      },
    }),
    [effectiveSubject, subjectStr, mdBase, mdRepoRoot]
  );

  // ✅ remove duplicate markdown title (first # heading)
  const contentForRender = useMemo(() => stripFirstMarkdownH1(content), [content]);

  if (!mounted) return null;

  if (error) {
    return (
      <div className={styles.errorWrap} data-theme={theme}>
        <div className={styles.errorCard}>
          <div className={styles.errorTitle}>Oops</div>
          <div className={styles.errorMsg}>{error}</div>
          <button className={styles.btn} onClick={() => router.push("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = prettyTitleFromMdOrSlug(topicStr || "");

  return (
    <div className={styles.page} data-theme={theme}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/favicon_new.png" alt="logo" className={styles.logo} />
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>
              {effectiveSubject || subjectStr || "Learning Portal"}
            </div>
            <div className={styles.brandSub}>Docs • Topics • Notes</div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.breadcrumb}>
            <span className={styles.crumbMuted}>Subject</span>
            <span className={styles.crumbStrong}>
              {effectiveSubject || subjectStr}
            </span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbStrong}>{pageTitle}</span>
          </div>

          <button
            className={styles.iconBtn}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>Topics</div>
            <div className={styles.sidebarMeta}>{topicKeys.length} items</div>
          </div>

          <input
            className={styles.search}
            placeholder="Search topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <nav className={styles.nav}>
            {filteredKeys.map((t, i) => {
              const slug = toSlugFromTitle(t);
              const href = `/topic/${encodeURIComponent(
                slug
              )}?subject=${encodeURIComponent(
                effectiveSubject || subjectStr || ""
              )}`;

              const active = normMdName(t) === normMdName(topicStr || "");

              return (
                <Link
                  key={t}
                  href={href}
                  className={`${styles.navItem} ${
                    active ? styles.navItemActive : ""
                  }`}
                >
                  <span className={styles.navIndex}>{i + 1}</span>
                  <span className={styles.navText}>{t}</span>
                  {active ? <span className={styles.activeDot} /> : null}
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.tipTitle}>Tip</div>
            <div className={styles.tipText}>
              Use search to quickly jump topics. Theme toggle is on the header.
            </div>
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.contentCard}>
            {/* ✅ Only ONE title. Removed Markdown pill also */}
            <div className={styles.titleRow}>
              <h1 className={styles.h1}>{pageTitle}</h1>
            </div>

            {contentForRender ? (
              <div className={styles.markdown}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents}
                >
                  {contentForRender}
                </ReactMarkdown>
              </div>
            ) : (
              <div className={styles.loading}>Loading…</div>
            )}
          </div>

          <footer className={styles.footer}>
            <span>© 2026 Learning Portal</span>
            <span className={styles.footerDot}>•</span>
            <span className={styles.footerMuted}>Built for fast learning</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
