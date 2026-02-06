"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMarkdown } from "../../hooks/useMarkdown";
import MarkdownViewer from "../../markdown/MarkdownViewer";

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

const SUBJECT_LABELS = {
  vuejs: "Vue.js",
  nextjs: "Next.js",
  sqlserver: "SQL Server",
};

export default function TopicCardSlide({
  topic,
  subject,
  index,
  total,
  activeIndex,
  slideStyle,
  slideClassName,
  orderedTopics = [],
  onJumpToIndex,
}) {
  const title = useMemo(() => topic?.topic_name || "Topic", [topic]);
  const isActive = activeIndex === index;

  const mdUrl = isActive ? topic?.md_url || "" : "";
  const { content, loading, error } = useMarkdown(mdUrl);

  const cardRef = useRef(null);
  const subjectKey = norm(subject);

  const subjectLabel = useMemo(() => {
    return SUBJECT_LABELS[subjectKey] || subject || "";
  }, [subject, subjectKey]);

  // Hide "Back to Content" for SQL Server cards only
  useEffect(() => {
    if (!isActive) return;
    if (subjectKey !== "sqlserver") return;
    if (!cardRef.current) return;

    const id = requestAnimationFrame(() => {
      const root = cardRef.current;
      const nodes = root.querySelectorAll("a,button");
      nodes.forEach((n) => {
        const txt = String(n.textContent || "").trim().toLowerCase();
        if (txt === "back to content") {
          n.style.display = "none";
          n.setAttribute("aria-hidden", "true");
        }
      });
    });

    return () => cancelAnimationFrame(id);
  }, [isActive, subjectKey, content, loading, error]);

  const showTopicDropdown =
    isActive && Array.isArray(orderedTopics) && orderedTopics.length > 0;

  return (
    <section
      className={[
        "absolute inset-0 h-full w-full overflow-hidden",
        "p-3 md:p-4",
        "[will-change:transform,opacity]",
        !isActive ? "pointer-events-none" : "pointer-events-auto",
        slideClassName || "",
      ].join(" ")}
      style={slideStyle}
      aria-hidden={!isActive}
    >
      <div
        ref={cardRef}
        data-subjectkey={subjectKey}
        className={[
          "w-full max-w-[980px] mx-auto h-full max-h-full",
          "flex flex-col overflow-hidden relative isolate",
          "rounded-[20px]",
          "[font-family:var(--card-font)]",
          "border border-slate-900/10 dark:border-white/12",
          "[background:radial-gradient(800px_260px_at_20%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(700px_240px_at_90%_0%,rgba(56,189,248,0.10),transparent_62%),rgba(255,255,255,0.94)]",
          "dark:[background:radial-gradient(800px_260px_at_20%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(700px_240px_at_90%_0%,rgba(56,189,248,0.16),transparent_62%),rgba(15,23,42,0.92)]",
          "shadow-[0_18px_45px_rgba(17,24,39,0.10),0_2px_10px_rgba(17,24,39,0.05)]",
          "dark:shadow-[0_18px_45px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.35)]",
          "after:content-[''] after:absolute after:inset-[-2px] after:rounded-[22px]",
          "after:bg-[radial-gradient(520px_260px_at_15%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(520px_260px_at_90%_10%,rgba(56,189,248,0.16),transparent_62%)]",
          "after:blur-[16px] after:opacity-[0.55] after:-z-10 after:pointer-events-none",
        ].join(" ")}
      >
        {/* HEADER (✅ sticky so scroll lo dropdown same untundi) */}
        <div
          className={[
            "sticky top-0 z-30",
            "relative cursor-default",
            "px-[14px] pt-[14px] pb-[12px] pr-[56px] md:px-4 md:pt-4 md:pb-[14px] md:pr-[60px]",
            "border-b border-slate-900/8 dark:border-white/10",
            "backdrop-blur-[12px] backdrop-saturate-[180%]",
            "[background:linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.80))]",
            "dark:[background:linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82))]",
          ].join(" ")}
        >
          <div className="text-[14px] leading-[1.25] tracking-[0.1px] font-[650] text-slate-900 dark:text-slate-200">
            {title}
          </div>

          {/* ✅ Subject + Dropdown same row (no wrap) */}
          <div className="mt-[8px] flex items-center gap-2 min-w-0">
            {subjectLabel ? (
              <span
                className={[
                  "flex-none inline-flex items-center gap-[6px]",
                  "px-[9px] py-1 rounded-full",
                  "text-[11px] font-[650]",
                  "text-slate-900/78 dark:text-slate-200/86",
                  "border border-slate-900/10 dark:border-white/10",
                  "bg-[linear-gradient(180deg,rgba(17,24,39,0.05),rgba(17,24,39,0.03))]",
                  "dark:bg-white/[0.06]",
                ].join(" ")}
              >
                {subjectLabel}
              </span>
            ) : null}

            {showTopicDropdown ? (
              <div
                className="flex items-center gap-[6px] min-w-0 flex-1 justify-end"
                aria-label="Topic dropdown"
              >
                <select
                  className={[
                    "h-[26px] px-2 rounded-full",
                    "text-[11px] font-[650]",
                    "min-w-[130px] max-w-[55vw] w-full",
                    "border border-slate-900/12 bg-white/92 text-slate-900/85",
                    "cursor-pointer outline-none",
                    "truncate",
                    "focus:ring-[3px] focus:ring-indigo-500/20",
                    "dark:border-white/14 dark:bg-slate-900/92 dark:text-slate-200/92",
                  ].join(" ")}
                  value={index}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (!Number.isFinite(idx)) return;
                    if (typeof onJumpToIndex === "function") onJumpToIndex(idx);
                  }}
                >
                  {orderedTopics.map((t, idx) => (
                    <option key={`${subjectKey}-${t?.topic_name || "topic"}-${idx}`} value={idx}>
                      {t?.topic_name || `Topic ${idx + 1}`}
                    </option>
                  ))}
                </select>

                <span
                  className={[
                    "flex-none text-[10px] font-[800]",
                    "px-[6px] py-[1px] rounded-full",
                    "border border-slate-900/10 bg-slate-900/[0.03] text-slate-900/55",
                    "dark:border-white/12 dark:bg-white/[0.06] dark:text-slate-200/60",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {orderedTopics.length}
                </span>
              </div>
            ) : null}
          </div>

          {Number.isFinite(total) && total > 0 ? (
            <div className="absolute right-3 top-[14px] md:right-[14px] md:top-4 text-[11px] font-[700] text-slate-900/55 dark:text-slate-200/55">
              {index + 1}/{total}
            </div>
          ) : null}
        </div>

        {/* BODY */}
        <div
          className={[
            "p-[14px] md:p-4",
            "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
            "overscroll-contain scrollbar-hide",
            "shadow-[inset_0_10px_12px_-12px_rgba(17,24,39,0.16),inset_0_-10px_12px_-12px_rgba(17,24,39,0.14)]",
            "dark:shadow-[inset_0_10px_12px_-12px_rgba(0,0,0,0.55),inset_0_-10px_12px_-12px_rgba(0,0,0,0.55)]",
          ].join(" ")}
        >
          {!isActive ? (
            <div className="relative p-[14px] overflow-hidden">
              <div
                className={[
                  "h-[220px] rounded-[16px] border border-slate-900/8",
                  "bg-white/88",
                  "[background:linear-gradient(rgba(17,24,39,0.10),rgba(17,24,39,0.10))_18px_18px/55%_10px_no-repeat,linear-gradient(rgba(17,24,39,0.08),rgba(17,24,39,0.08))_18px_38px/38%_8px_no-repeat,linear-gradient(rgba(17,24,39,0.07),rgba(17,24,39,0.07))_18px_72px/82%_8px_no-repeat,linear-gradient(rgba(17,24,39,0.07),rgba(17,24,39,0.07))_18px_92px/78%_8px_no-repeat,linear-gradient(rgba(17,24,39,0.07),rgba(17,24,39,0.07))_18px_112px/74%_8px_no-repeat,rgba(255,255,255,0.88)]",
                ].join(" ")}
                aria-hidden="true"
              />
              <div
                className={[
                  "pointer-events-none absolute inset-0 opacity-[0.55]",
                  "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.32)_45%,transparent_80%)]",
                  "animate-mShimmer",
                ].join(" ")}
              />
            </div>
          ) : loading ? (
            <div className="p-[14px] font-[700] text-slate-900 dark:text-slate-200">
              Loading markdown…
            </div>
          ) : error ? (
            <div className="p-[14px] text-slate-900 dark:text-slate-200">
              <div className="font-[900]">Failed to load</div>
              <div className="opacity-80">{String(error)}</div>
            </div>
          ) : (
            <MarkdownViewer content={content} />
          )}
        </div>
      </div>
    </section>
  );
}
