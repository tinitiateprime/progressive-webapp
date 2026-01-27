"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

type Topic = {
  topic_name: string;
  md_url: string;
};

export default function SubjectPage() {
  const router = useRouter();
  const { subject } = router.query;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // ONLINE / OFFLINE DETECT
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

  // key per subject
const getSubjectCacheKey = (subject: string) =>
  `subject-topics-${subject.toLowerCase()}`;

useEffect(() => {
  if (!router.isReady) return;
  if (!subject) return;

  const subjectStr = String(subject);
  const cacheKey = getSubjectCacheKey(subjectStr);

  const url =
    "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

  const loadFromCache = () => {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return false;
    try {
      const cached: Topic[] = JSON.parse(raw);
      setTopics(cached);
      setLoading(false);
      return true;
    } catch {
      return false;
    }
  };

  // If offline, try local cache only
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const ok = loadFromCache();
    if (!ok) {
      setError("Offline and no cached data for this subject.");
      setLoading(false);
    }
    return;
  }

  // Online: fetch, then cache
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const found = data.qna_catalog.find(
        (s: any) =>
          s.subject.toLowerCase() === subjectStr.toLowerCase()
      );
      if (!found) throw new Error("Subject not found");
      setTopics(found.topics);
      setLoading(false);

      if (typeof window !== "undefined") {
        localStorage.setItem(cacheKey, JSON.stringify(found.topics));
      }
    })
    .catch(() => {
      // Network failed → try cache as fallback
      const ok = loadFromCache();
      if (!ok) {
        setError("Failed to load subject");
        setLoading(false);
      }
    });
}, [router.isReady, subject]);


  // SAVE WHOLE SUBJECT (ALL md_url) FOR OFFLINE
  const saveSubjectForOffline = async () => {
  if (!("serviceWorker" in navigator)) {
    alert("Service Worker not supported");
    return;
  }

  if (!topics.length) {
    alert("No topics loaded yet");
    return;
  }

  if (!navigator.onLine) {
    alert("You are offline. Go online once to download the subject.");
    return;
  }

  // Only topic markdown files
  const urls: string[] = topics.map((t) => t.md_url);

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "PREFETCH_URLS",
      urls,
    });
    alert(
      `Saved entire "${String(
        subject
      )}" subject for Offline ✅ (${topics.length} topics)`
    );
  } catch (err) {
    alert("Failed to save for offline. Ensure Service Worker is registered.");
  }
};


  const totalPages = Math.max(1, Math.ceil(topics.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentTopics = topics.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="max-w-md text-center text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    );

  const subjectTitle = String(subject).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200 py-6 px-3 sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold uppercase text-white shadow-sm">
                Ti
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Subject
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-wide text-slate-900 sm:text-xl">
                  {subjectTitle}
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Topics available:{" "}
                  <span className="font-semibold text-slate-900">
                    {topics.length}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 sm:text-sm"
                  aria-label="Go home"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1v-9.5z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Home</span>
                </button>

                <button
                  onClick={saveSubjectForOffline}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm sm:text-sm ${
                    isOffline
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  aria-label="Save subject for offline"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4h16v12H4zM8 4v12M16 4v12M4 16h16v4H4z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Save offline</span>
                </button>
              </div>

              <span
                className={`inline-flex h-3 w-3 items-center justify-center rounded-full ${
                  isOffline ? "bg-slate-400" : "bg-emerald-500"
                }`}
                aria-label={isOffline ? "Offline" : "Online"}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-3 pt-3 sm:px-6 sm:pt-4">
          {/* rest of your topics grid + pagination + status card unchanged */}
          {/* ... (your existing JSX from topics grid onwards) ... */}
        </main>
      </div>
    </div>
  );
}
