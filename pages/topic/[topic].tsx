"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TopicMap = { [key: string]: string };

// --- Helper Functions ---
function normalizeRawUrl(url: string) {
  return String(url).replace("https://raw.github.com/", "https://raw.githubusercontent.com/");
}
function baseFromRawUrl(rawFileUrl: string) {
  const u = normalizeRawUrl(rawFileUrl);
  const idx = u.lastIndexOf("/");
  return idx >= 0 ? u.slice(0, idx + 1) : u;
}
function repoRootFromRaw(rawFileUrl: string) {
  const u = normalizeRawUrl(rawFileUrl);
  const parts = u.split("/");
  if (parts.length >= 6) return parts.slice(0, 6).join("/") + "/";
  return baseFromRawUrl(u);
}
function toRawIfGithubBlob(url: string) {
  if (/^https?:\/\/github\.com\/.+\/blob\//i.test(url)) {
    return url.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/");
  }
  return url;
}
function normMdName(s: string) {
  return String(s).toLowerCase().replace(/\.md$/i, "").replace(/^\d+[-_]?/, "").replace(/[^a-z0-9]/g, "");
}
function toSlugFromTitle(title: string) {
  return String(title).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function stripFirstMarkdownH1(md: string) {
  if (!md) return md;
  return md.replace(/^\s*#\s+.+\n+/m, "");
}
function prettyTitleFromMdOrSlug(s: string) {
  const clean = String(s).replace(/^\.\//, "").replace(/^\/+/, "").replace(/\.md$/i, "").replace(/^\d+[-_]?/i, "").replace(/[-_]+/g, " ").trim();
  return clean ? clean.replace(/\b\w/g, (c) => c.toUpperCase()) : "Topic";
}

export default function TopicPage() {
  const router = useRouter();
  const { subject, topic } = router.query;

  const subjectStr = Array.isArray(subject) ? subject[0] : subject;
  const topicStr = Array.isArray(topic) ? topic[0] : topic;

  const [topics, setTopics] = useState<TopicMap>({});
  const [content, setContent] = useState("");
  const [mounted, setMounted] = useState(false);
  const [effectiveSubject, setEffectiveSubject] = useState<string | null>(null);
  const [mdBase, setMdBase] = useState("");
  const [mdRepoRoot, setMdRepoRoot] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const last = localStorage.getItem("last-subject");
    if (!subjectStr && last) setEffectiveSubject(last);
    if (subjectStr) {
      setEffectiveSubject(subjectStr);
      localStorage.setItem("last-subject", subjectStr);
    }
  }, [mounted, subjectStr]);

  useEffect(() => {
    if (!mounted || !topicStr) return;
    const run = async () => {
      try {
        const res = await fetch("/data.json");
        const data = await res.json();
        let subj = effectiveSubject || subjectStr || localStorage.getItem("last-subject");
        
        if (!subj) return;

        const subjMap = data.subjects?.[subj];
        if (!subjMap) return;
        setTopics(subjMap);

        const want = normMdName(topicStr);
        let resolvedUrl = "";
        for (const url of Object.values<string>(subjMap)) {
          const u = normalizeRawUrl(url);
          if (normMdName(u.split("/").pop() || "") === want) {
            resolvedUrl = u;
            break;
          }
        }

        if (resolvedUrl) {
          setMdBase(baseFromRawUrl(resolvedUrl));
          setMdRepoRoot(repoRootFromRaw(resolvedUrl));
          const mdRes = await fetch(resolvedUrl);
          const md = await mdRes.text();
          setContent(md);
        }
      } catch (e) { console.error("Load failed"); }
    };
    run();
  }, [mounted, topicStr, effectiveSubject]);

  const filteredKeys = useMemo(() => {
    const keys = Object.keys(topics);
    return query ? keys.filter(k => k.toLowerCase().includes(query.toLowerCase())) : keys;
  }, [query, topics]);

  const mdComponents = useMemo(() => ({
    img: ({ src = "", alt = "" }: any) => {
      let finalSrc = toRawIfGithubBlob(String(src || "").trim());
      if (!/^https?:\/\//i.test(finalSrc)) {
        finalSrc = finalSrc.startsWith("/") ? mdRepoRoot + finalSrc.slice(1) : mdBase + finalSrc.replace(/^\.\//, "");
      }
      return <img src={finalSrc} alt={alt} className="mdImage" onError={(e) => (e.currentTarget.src = "/favicon_new.png")} />;
    }
  }), [mdBase, mdRepoRoot]);

  if (!mounted) return null;

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      
      <header className="header">
        <div className="brand">
          <img src="/favicon_new.png" alt="logo" className="logo" />
          <div className="brandText">
            <div className="brandTitle">{effectiveSubject}</div>
            <div className="brandSub">Documentation Portal</div>
          </div>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <div className="sidebarTitle">Menu</div>
          <input className="search" placeholder="Filter..." onChange={(e) => setQuery(e.target.value)} />
          <nav className="nav">
            {filteredKeys.map((t, i) => (
              <Link 
                key={t} 
                href={`/topic/${toSlugFromTitle(t)}?subject=${effectiveSubject}`}
                className={`navItem ${normMdName(t) === normMdName(topicStr || "") ? "navItemActive" : ""}`}
              >
                <span className="navIndex">{i + 1}</span>
                <span className="navText">{t}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="contentArea">
          <div className="contentCard">
            <h1 className="h1">{prettyTitleFromMdOrSlug(topicStr || "")}</h1>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {stripFirstMarkdownH1(content)}
              </ReactMarkdown>
            </div>
          </div>
          <footer className="footer">
            © 2026 Learning Portal • Built for Clarity
          </footer>
        </main>
      </div>
    </div>
  );
}

const cssStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: "Inter", sans-serif;
    background: linear-gradient(180deg, #f5fbff, #eef7f2); /* Main Page Background */
  }

  /* Header with your Teal-Blue Gradient */
  .header {
    height: 70px;
    background: linear-gradient(90deg, #0f766e, #0284c7);
    display: flex;
    align-items: center;
    padding: 0 24px;
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .brand { display: flex; align-items: center; gap: 14px; }
  .logo { width: 42px; height: 42px; }
  .brandText { color: #ffffff; }
  .brandTitle { font-size: 18px; font-weight: 700; text-transform: capitalize; letter-spacing: -0.01em; }
  .brandSub { font-size: 12px; opacity: 0.85; font-weight: 400; }

  .shell {
    display: flex;
    margin-top: 70px;
    flex: 1;
    width: 100%;
  }

  /* Sidebar Color and Style */
  .sidebar {
    width: 300px;
    background: #ffffff; /* Solid White sidebar for professional contrast */
    border-right: 1px solid #e5eef5;
    padding: 24px 20px;
    height: calc(100vh - 70px);
    position: sticky;
    top: 70px;
    overflow-y: auto;
  }

  .sidebarTitle { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.05em; }

  .search {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    margin-bottom: 25px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  .search:focus { border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.1); }

  .navItem {
    display: flex;
    padding: 10px 14px;
    text-decoration: none;
    color: #475569;
    font-weight: 500;
    font-size: 14px;
    border-radius: 8px;
    margin-bottom: 5px;
    transition: 0.2s;
  }
  .navItem:hover { background: #f1f5f9; color: #0284c7; }
  
  .navItemActive { 
    background: linear-gradient(135deg, #22c55e, #0ea5e9) !important; 
    color: white !important; 
    box-shadow: 0 4px 10px rgba(2, 132, 199, 0.2);
  }
  .navIndex { margin-right: 12px; opacity: 0.5; font-size: 12px; font-family: monospace; }

  /* Content Area with Background and Card */
  .contentArea {
    flex: 1;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: transparent; /* Shows page gradient */
  }

  .contentCard {
    background: #ffffff;
    width: 100%;
    max-width: 950px;
    padding: 60px;
    border-radius: 24px;
    box-shadow: 0 4px 25px rgba(0,0,0,0.03);
    border: 1px solid #eef2f6;
    min-height: 80vh;
  }

  .h1 { font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 35px; letter-spacing: -0.03em; }

  .markdown { line-height: 1.8; color: #334155; font-size: 16px; }
  .markdown h2 { margin-top: 35px; margin-bottom: 15px; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  .markdown p { margin-bottom: 20px; }
  
  .mdImage { 
    max-width: 100%; 
    border-radius: 16px; 
    margin: 30px 0; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.08); 
    border: 1px solid #f0f0f0;
  }

  .footer {
    margin-top: 50px;
    color: #94a3b8;
    font-size: 13px;
    padding-bottom: 30px;
  }

  @media (max-width: 1024px) {
    .sidebar { display: none; }
    .contentArea { padding: 20px; }
    .contentCard { padding: 30px; }
  }
`;
