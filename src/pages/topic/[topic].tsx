"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import dynamic from "next/dynamic";

type CatalogTopic = {
  topic_name: string;
  md_url: string;
};

type CatalogSubject = {
  subject: string;
  topics: CatalogTopic[];
};


// Font options for users to choose from
const FONT_OPTIONS = [
  { name: 'Serif Classic', value: 'font-serif', description: 'Georgia, Times' },
  { name: 'Sans Modern', value: 'font-sans', description: 'System fonts' },
  { name: 'Mono Tech', value: 'font-mono', description: 'Monospace' },
  { name: 'Literary', value: 'literary', description: 'Crimson Text' },
  { name: 'Editorial', value: 'editorial', description: 'Spectral' },
];

export default function TopicPage() {
  const router = useRouter();
  const { topic, subject } = router.query;

  const [catalogData, setCatalogData] = useState<CatalogSubject | null>(null);
  const [content, setContent] = useState("");
  const [currentMdUrl, setCurrentMdUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [fontChoice, setFontChoice] = useState('editorial');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
const [isFavorite, setIsFavorite] = useState(false);
  // Find current topic index for prev/next navigation
  const currentIndex = catalogData
    ? catalogData.topics.findIndex((t) => t.topic_name === topic)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = catalogData ? currentIndex < catalogData.topics.length - 1 : false;


  /* ONLINE / OFFLINE DETECT */
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

// simple localStorage key for favorites
// Favorites management
const FAV_KEY = "topic_favorites";
const CACHE_NAME = "favorites-cache";

useEffect(() => {
  if (!topic || !subject) return;
  
  const key = `${subject}::${topic}`;
  
  const loadFavorites = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match('/favorites.json');
      
      if (response) {
        const existing = await response.json();
        setIsFavorite(existing.includes(key));
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setIsFavorite(false);
    }
  };
  
  loadFavorites();
}, [topic, subject]);

// Toggle favorite function
const toggleFavorite = async () => {
  if (!topic || !subject) return;
  
  const key = `${subject}::${topic}`;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/favorites.json');
    
    let existing = [];
    if (response) {
      existing = await response.json();
    }
    
    let next;
    if (existing.includes(key)) {
      // Remove from favorites
      next = existing.filter((k: string) => k !== key);
      setIsFavorite(false);
    } else {
      // Add to favorites
      next = [...existing, key];
      setIsFavorite(true);
    }
    
    // Save to cache
    const blob = new Blob([JSON.stringify(next)], { type: 'application/json' });
    const newResponse = new Response(blob);
    await cache.put('/favorites.json', newResponse);
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};
  const navigateToPrev = () => {
    if (hasPrev) {
      const prevTopic = catalogData?.topics[currentIndex - 1] ?? null;
      router.push(`/topic/${encodeURIComponent(prevTopic?.topic_name ?? "")}?subject=${subject}`);
    }
  };

  const navigateToNext = () => {
    if (hasNext) {
      const nextTopic = catalogData?.topics[currentIndex + 1] ?? null;
      router.push(`/topic/${encodeURIComponent(nextTopic?.topic_name ?? "")}?subject=${subject}`);
    }
  };

  // Font class mapping
  const getFontClass = () => {
    switch (fontChoice) {
      case 'literary':
        return 'font-literary';
      case 'editorial':
        return 'font-editorial';
      default:
        return fontChoice;
    }
  };

  /* FETCH CATALOG + MARKDOWN */
  useEffect(() => {
    if (!topic || !subject) return;

    const catalogUrl =
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

    fetch(catalogUrl)
      .then((res) => res.json())
      .then((data: { qna_catalog: CatalogSubject[] }) => {
        const catalog = data.qna_catalog.find(
          (s) => s.subject.toLowerCase() === String(subject).toLowerCase()
        );
        if (!catalog) throw new Error("Subject not found");

        setCatalogData(catalog);

        const found = catalog.topics.find((t) => t.topic_name === topic);
        if (!found) throw new Error("Topic not found");

        setCurrentMdUrl(found.md_url);
        return fetch(found.md_url);
      })
      .then((res) => res.text())
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch(() => {
        setError(
          navigator.onLine
            ? "Failed to load content"
            : "Offline – cached data not found"
        );
        setLoading(false);
      });
  }, [topic, subject]);

  /* SAVE WHOLE SUBJECT FOR OFFLINE */
  const saveSubjectForOffline = async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker not supported");
      return;
    }

    if (!catalogData) {
      alert("Catalog data not loaded yet");
      return;
    }

    const urls: string[] = [
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json",
    ];

    catalogData.topics.forEach((t) => urls.push(t.md_url));

    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: "PREFETCH_URLS",
        urls,
      });
      alert(
        `Saved entire "${catalogData.subject}" subject for Offline ✅ (${catalogData.topics.length} topics)`
      );
    } catch (err) {
      alert("Failed to save for offline. Ensure Service Worker is registered.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="max-w-md text-center text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!catalogData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-600">No catalog data</p>
      </div>
    );
  }
 return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
        
        .font-literary {
          font-family: 'Crimson Text', Georgia, serif;
        }
        
        .font-editorial {
          font-family: 'Spectral', Georgia, serif;
        }
      `}</style>

      <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900">
        <main className="min-h-screen">
          <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 lg:px-10">
            <div className="flex w-full flex-col items-center">
              {/* Main Card */}
              <article className={`relative h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] w-full max-w-5xl overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/50 bg-white shadow-2xl ${getFontClass()}`}>
                
                {/* Compact Header - Reorganized for mobile */}
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                  {/* Top row - Controls */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6">
                    {/* Left controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Brand icon */}
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-[10px] sm:text-xs font-bold uppercase text-white shadow-md ring-2 ring-blue-100">
                        Ti
                      </div>
                      
                      {/* Menu button */}
                      <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95"
                        aria-label="Toggle topics"
                        title="Topics menu"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>

                      {/* Navigation: Back & Home */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <button
                          onClick={() => router.back()}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                          aria-label="Go back"
                          title="Back"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <button
                          onClick={() => router.push("/dashboard")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                          aria-label="Go to dashboard"
                          title="Home"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-medium ${
                          isOffline
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-rose-500" : "bg-emerald-500"}`} />
                        <span className="hidden sm:inline">{isOffline ? "Offline" : "Online"}</span>
                      </span>

                      {/* Font selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowFontMenu(!showFontMenu)}
                          className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                          aria-label="Choose font"
                          title="Font options"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6v12M12 6v12M17 6v12" />
                          </svg>
                        </button>
                        
                        {/* Font dropdown */}
                        {showFontMenu && (
                          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-xl z-20">
                            <div className="p-2">
                              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Font Style
                              </div>
                              {FONT_OPTIONS.map((font) => (
                                <button
                                  key={font.value}
                                  onClick={() => {
                                    setFontChoice(font.value);
                                    setShowFontMenu(false);
                                  }}
                                  className={`w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                                    fontChoice === font.value
                                      ? "bg-blue-600 text-white"
                                      : "text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="font-medium">{font.name}</div>
                                  <div className={`text-xs ${fontChoice === font.value ? "text-blue-100" : "text-slate-500"}`}>
                                    {font.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Favorite star */}
                      <button
                        onClick={toggleFavorite}
                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-transparent text-amber-500 transition-all hover:bg-amber-50 active:scale-95"
                        aria-label="Toggle favorite"
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg
                          className={`h-5 w-5 transition-all ${
                            isFavorite ? "fill-amber-400 stroke-amber-500 scale-110" : "fill-none stroke-amber-500"
                          }`}
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.5c.3-.92 1.74-.92 2.04 0l1.32 4.07a1 1 0 0 0 .95.69h4.28c.97 0 1.37 1.24.59 1.8l-3.46 2.5a1 1 0 0 0-.36 1.12l1.32 4.07c.3.92-.76 1.68-1.54 1.12l-3.46-2.5a1 1 0 0 0-1.18 0l-3.46 2.5c-.78.56-1.84-.2-1.54-1.12l1.32-4.07a1 1 0 0 0-.36-1.12l-3.46-2.5c-.78-.56-.38-1.8.59-1.8h4.28a1 1 0 0 0 .95-.69l1.32-4.07z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Bottom row - Topic title & navigation */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2 sm:px-4 md:px-6">
                    {/* Previous button */}
                    <button
                      onClick={navigateToPrev}
                      disabled={!hasPrev}
                      className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-all ${
                        hasPrev
                          ? "bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow active:scale-95"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      aria-label="Previous topic"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Topic title */}
                    <div className="flex-1 text-center min-w-0 px-2">
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                        Topic {currentIndex + 1} of {catalogData.topics.length}
                      </p>
                      <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">
                        {topic}
                      </h1>
                    </div>

                    {/* Next button */}
                    <button
                      onClick={navigateToNext}
                      disabled={!hasNext}
                      className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-all ${
                        hasNext
                          ? "bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow active:scale-95"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      aria-label="Next topic"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </header>

                {/* Content area - Optimized for reading */}
                <div className="h-[calc(100%-8rem)] sm:h-[calc(100%-7rem)] overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-12 md:py-10">
                  <div className="mx-auto max-w-3xl">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ src, alt }) => {
                          if (!src || typeof src !== "string") return null;
                          let finalSrc = src;
                          if (!src.startsWith("http")) {
                            const base = currentMdUrl.substring(0, currentMdUrl.lastIndexOf("/") + 1);
                            finalSrc = base.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/") + src;
                          }
                          return (
                            <img
                              src={finalSrc}
                              alt={alt ?? ""}
                              className="my-6 w-full rounded-xl border border-slate-200 bg-white object-cover shadow-md mx-auto max-w-md max-w-lg"
                            />
                          );
                        },
                        a: (props) => (
                          <a
                            {...props}
                            className="break-words font-medium text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-400"
                          />
                        ),
                        code: ({ inline, className, children, ...rest }: any) => {
                          if (inline) {
                            return (
                              <code
                                className="break-words rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.9em] font-mono text-slate-800 border border-slate-200"
                                {...rest}
                              >
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="my-6 overflow-x-auto rounded-xl bg-slate-900 p-4 sm:p-5 text-sm text-slate-50 shadow-lg border border-slate-700">
                              <code className={`${className ?? ""} break-words font-mono`} {...rest}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        h1: (props) => (
                          <h1
                            className="mt-8 mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight"
                            {...props}
                          />
                        ),
                        h2: (props) => (
                          <h2
                            className="mt-8 mb-4 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight"
                            {...props}
                          />
                        ),
                        h3: (props) => (
                          <h3
                            className="mt-6 mb-3 text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 leading-snug"
                            {...props}
                          />
                        ),
                        h4: (props) => (
                          <h4
                            className="mt-5 mb-2 text-base sm:text-lg md:text-xl font-semibold text-slate-800"
                            {...props}
                          />
                        ),
                        p: (props) => (
                          <p className="mb-4 break-words leading-relaxed text-slate-700 text-[15px] sm:text-base" {...props} />
                        ),
                        ul: (props) => (
                          <ul
                            className="my-4 space-y-2 pl-6 list-disc marker:text-blue-500"
                            {...props}
                          />
                        ),
                        ol: (props) => (
                          <ol
                            className="my-4 space-y-2 pl-6 list-decimal marker:text-blue-500 marker:font-semibold"
                            {...props}
                          />
                        ),
                        li: (props) => (
                          <li className="break-words leading-relaxed text-slate-700 pl-2" {...props} />
                        ),
                        blockquote: (props) => (
                          <blockquote
                            className="my-6 border-l-4 border-blue-500 bg-blue-50/50 py-3 px-5 italic text-slate-700 rounded-r-lg"
                            {...props}
                          />
                        ),
                        hr: () => (
                          <hr className="my-8 border-t-2 border-slate-200" />
                        ),
                        table: (props) => (
                          <div className="my-6 overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-sm" {...props} />
                          </div>
                        ),
                        thead: (props) => (
                          <thead className="bg-slate-100" {...props} />
                        ),
                        th: (props) => (
                          <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-900" {...props} />
                        ),
                        td: (props) => (
                          <td className="border-b border-slate-100 px-4 py-3 text-slate-700" {...props} />
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Sidebar drawer - Topics navigation */}
                <aside
                  className={`absolute inset-y-0 left-0 z-30 flex w-72 max-w-[85%] flex-col rounded-r-xl border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                  }`}
                >
                  {/* Sidebar header */}
                  <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Topics
                      </span>
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {catalogData.topics.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
                      aria-label="Close topics"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Topics list */}
                  <nav className="flex-1 overflow-y-auto px-3 py-3">
                    <div className="space-y-1">
                      {catalogData.topics.map((t, index) => {
                        const isActive = topic === t.topic_name;
                        return (
                          <Link
                            key={t.topic_name}
                            href={`/topic/${encodeURIComponent(t.topic_name)}?subject=${subject}`}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center justify-between rounded-lg px-3.5 py-3 text-sm font-medium transition-all ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-slate-50 text-slate-800 hover:bg-slate-100 hover:shadow-sm"
                            }`}
                          >
                            <span className="flex-1 truncate pr-2">{t.topic_name}</span>
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isActive 
                                  ? "bg-blue-500 text-white" 
                                  : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </nav>
                </aside>

                {/* Overlay when sidebar is open */}
                {sidebarOpen && (
                  <div
                    className="absolute inset-0 z-20 bg-slate-900/20 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}

                {/* Mobile bottom navigation (shown only on mobile) */}
                <div className="absolute bottom-0 left-0 right-0 flex sm:hidden items-center justify-center gap-3 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3">
                  <button
                    onClick={() => router.push("/subject/" + encodeURIComponent(subject as string))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm active:scale-95"
                    aria-label="Go back"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm active:scale-95"
                    aria-label="Go to dashboard"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
