"use client";

import { useEffect } from "react";
import Link from "next/link";

export type OffcanvasTopic = {
  topic_name: string;
  md_url: string;
};

export type OffcanvasData = {
  subject: string;
  topics: OffcanvasTopic[];
};

type OffcanvasSidebarProps = {
  open: boolean;
  onClose: () => void;
  data: OffcanvasData | null;
  activeTopic?: string | string[];
  subjectParam?: string | string[];
};

export default function OffcanvasSidebar({
  open,
  onClose,
  data,
  activeTopic,
  subjectParam,
}: OffcanvasSidebarProps) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const subjectLabel = typeof subjectParam === "string"
    ? subjectParam
    : data?.subject ?? "";

  const active = typeof activeTopic === "string" ? activeTopic : "";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold tracking-wide">
            {subjectLabel.toString().toUpperCase()}
          </h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {!data && (
            <p className="text-sm text-gray-500">
              No catalog data.
            </p>
          )}

          {data?.topics.map((t) => {
            const isActive = active === t.topic_name;
            return (
              <Link
                key={t.topic_name}
                href={`/topic/${encodeURIComponent(
                  t.topic_name
                )}?subject=${subjectParam ?? data.subject}`}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onClick={onClose}
              >
                {t.topic_name}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
