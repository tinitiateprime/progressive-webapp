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

  // FETCH SUBJECT TOPICS (no caching)
  useEffect(() => {
    if (!router.isReady) return;
    if (!subject) return;

    const url =
      "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metadata/qna_catalog.json";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const found = data.qna_catalog.find(
          (s: any) =>
            s.subject.toLowerCase() === String(subject).toLowerCase()
        );
        if (!found) throw new Error("Subject not found");
        setTopics(found.topics);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subject");
        setLoading(false);
      });
  }, [router.isReady, subject]);

  // SAVE WHOLE SUBJECT (ALL md_url) FOR OFFLINE – disabled for now
  const saveSubjectForOffline = async () => {
    alert(
      "Offline save is currently disabled. Please stay online to browse topics."
    );
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
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm sm:text-sm bg-slate-400 cursor-not-allowed"
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
          {/* Header text */}
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
              Topics ({topics.length})
            </h2>
            <span className="text-[11px] text-slate-500 sm:text-xs">
              Tap a topic to open its Q&A
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 mb-4">
            {currentTopics.map((t, idx) => {
              const globalIndex = startIndex + idx;
              return (
                <Link
                  key={t.topic_name}
                  href={`/topic/${encodeURIComponent(
                    t.topic_name
                  )}?subject=${subject}`}
                  className="group block h-full"
                >
                  <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left shadow-[0_1px_0_rgba(15,23,42,0.04)] transition duration-150 group-hover:-translate-y-1 group-hover:border-indigo-200 group-hover:shadow-md">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span></span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          fill="none"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        open
                      </span>
                    </div>
                    <div className="mb-2 line-clamp-2 text-sm font-medium text-slate-900 font-bold">
                      {t.topic_name}
                    </div>
                    <div className="mt-auto pt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      Q&A Topic
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mb-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 ${
                  currentPage === 1
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Prev</span>
              </button>

              <span className="text-[11px] text-slate-500 sm:text-xs">
                Page{" "}
                <span className="font-semibold text-slate-900">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {totalPages}
                </span>
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 ${
                  currentPage === totalPages
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Next</span>
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Status */}
          <div
            className={`rounded-md border px-3 py-2 text-[11px] leading-relaxed sm:text-xs ${
              isOffline
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-indigo-200 bg-indigo-50 text-indigo-800"
            }`}
          >
            <span className="font-semibold">Status: </span>
            {isOffline
              ? "You are offline. Topic loading may fail because there is no offline cache."
              : "You are online. You can browse all topics normally."}
          </div>
        </main>
      </div>
    </div>
  );
}