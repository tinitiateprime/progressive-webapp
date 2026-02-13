// File: TopicCardSlide.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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

function toIntOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function getRow(t) {
  return toIntOrNull(t?.scroll_row ?? t?.scrollRow ?? t?.row);
}
function getCol(t) {
  return toIntOrNull(
    t?.scroll_col ??
      t?.scrollCol ??
      t?.scroll_column ??
      t?.scrollColumn ??
      t?.col ??
      t?.column ??
      t?.topic_position ??
      t?.topicPosition
  );
}

function TripleChevron({ animated, direction = "right", size = 12 }) {
  const rotate =
    direction === "right"
      ? "rotate(0deg)"
      : direction === "left"
      ? "rotate(180deg)"
      : direction === "up"
      ? "rotate(-90deg)"
      : "rotate(90deg)"; // down

  // smaller size => thinner line (looks cleaner)
  const sw = Math.max(3.5, size * 0.42);

  return (
    <span className="relative grid place-items-center">
      <style>{`
        @keyframes mChevronPulse {
          0%   { opacity: .18; transform: translateX(-1px); }
          35%  { opacity: 1;   transform: translateX(0px); }
          70%  { opacity: .35; transform: translateX(1px); }
          100% { opacity: .18; transform: translateX(-1px); }
        }
      `}</style>

      <span style={{ transform: rotate }}>
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M12 14 L28 32 L12 50"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              animated
                ? { animation: "mChevronPulse 1.05s ease-in-out infinite", animationDelay: "0ms" }
                : { opacity: 0.55 }
            }
          />
          <path
            d="M26 14 L42 32 L26 50"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              animated
                ? { animation: "mChevronPulse 1.05s ease-in-out infinite", animationDelay: "160ms" }
                : { opacity: 0.75 }
            }
          />
          <path
            d="M40 14 L56 32 L40 50"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              animated
                ? { animation: "mChevronPulse 1.05s ease-in-out infinite", animationDelay: "320ms" }
                : { opacity: 1 }
            }
          />
        </svg>
      </span>
    </span>
  );
}


/**
 * ✅ Fix markdown relative image URLs:
 * converts ![](./img.png) -> absolute based on mdUrl
 */
function resolveMarkdownAssetUrls(markdown = "", mdUrl = "") {
  if (!markdown || !mdUrl) return markdown;
  if (typeof window === "undefined") return markdown;

  let base;
  try {
    base = new URL(mdUrl, window.location.href).href;
  } catch {
    return markdown;
  }

  const isRelative = (u) => {
    const s = String(u || "").trim();
    return (
      s &&
      !s.startsWith("http://") &&
      !s.startsWith("https://") &&
      !s.startsWith("data:") &&
      !s.startsWith("blob:") &&
      !s.startsWith("/") &&
      !s.startsWith("#")
    );
  };

  // Markdown image: ![alt](url "title")
  const mdImg = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let out = markdown.replace(mdImg, (full, alt, inside) => {
    const raw = String(inside || "").trim();
    const unwrapped =
      raw.startsWith("<") && raw.endsWith(">")
        ? raw.slice(1, -1).trim()
        : raw;

    const firstSpace = unwrapped.search(/\s/);
    const urlPart = (firstSpace === -1 ? unwrapped : unwrapped.slice(0, firstSpace)).trim();
    const tail = firstSpace === -1 ? "" : unwrapped.slice(firstSpace);

    if (!isRelative(urlPart)) return full;

    try {
      const abs = new URL(urlPart, base).href;
      return `![${alt}](${abs}${tail})`;
    } catch {
      return full;
    }
  });

  // HTML <img src="...">
  out = out.replace(/<img([^>]*?)src=(["'])(.*?)\2([^>]*?)>/gi, (m, a, q, src, b) => {
    if (!isRelative(src)) return m;
    try {
      const abs = new URL(src, base).href;
      return `<img${a}src=${q}${abs}${q}${b}>`;
    } catch {
      return m;
    }
  });

  return out;
}

/** ✅ Nav indicator (up + left + dot + right + down) — based on GRID (rows/cols), NOT markdown scroll */
function NavPill({ leftEnd, rightEnd, upEnd, downEnd }) {
  const leftColor = leftEnd ? "text-red-500" : "text-emerald-400";
  const rightColor = rightEnd ? "text-red-500" : "text-emerald-400";

  const upColor = upEnd ? "text-red-500/30" : "text-red-500";
  const downColor = downEnd ? "text-red-500/30" : "text-emerald-400";

  const pillBg =
    leftEnd && rightEnd && upEnd && downEnd
      ? "bg-red-500/8 border-red-500/18"
      : leftEnd || rightEnd || upEnd || downEnd
      ? "bg-white/6 border-white/12"
      : "bg-white/6 border-white/12";

  const dotColor =
    leftEnd || rightEnd || upEnd || downEnd ? "bg-red-500/70" : "bg-emerald-400/70";

  const CHEV = 11; // ✅ small arrow size (try 10 if you want even smaller)

  return (
    <div
      className={[
        "px-1.5 py-0.5 rounded-full flex flex-col items-center gap-[2px]", // ✅ compact
        "border backdrop-blur-[14px] backdrop-saturate-[200%]",
        "shadow-[0_8px_16px_rgba(0,0,0,0.28)]",
        pillBg,
      ].join(" ")}
      aria-hidden="true"
      title="Navigate left / right / up / down"
    >
      {/* 🔼 Up */}
      <span className={upColor}>
        <TripleChevron animated={!upEnd} direction="up" size={CHEV} />
      </span>

      {/* ◀ ● ▶ */}
      <div className="flex items-center gap-[2px]">
        <span className={leftColor}>
          <TripleChevron animated={!leftEnd} direction="left" size={CHEV} />
        </span>

        <span className={["mx-[2px] w-[4px] h-[4px] rounded-full", dotColor].join(" ")} />

        <span className={rightColor}>
          <TripleChevron animated={!rightEnd} direction="right" size={CHEV} />
        </span>
      </div>

      {/* 🔽 Down */}
      <span className={downColor}>
        <TripleChevron animated={!downEnd} direction="down" size={CHEV} />
      </span>
    </div>
  );
}


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
  const bodyRef = useRef(null);

  const subjectKey = norm(subject);
  const subjectLabel = useMemo(
    () => SUBJECT_LABELS[subjectKey] || subject || "",
    [subject, subjectKey]
  );

  const jump = (i) => {
    if (i === null || i === undefined) return;
    if (typeof onJumpToIndex === "function") onJumpToIndex(i);
  };

  const showTopicDropdown =
    isActive && Array.isArray(orderedTopics) && orderedTopics.length > 0;

  // ✅ Current topic grid coords
  const rawRow = useMemo(() => getRow(topic), [topic]);
  const rawCol = useMemo(() => getCol(topic), [topic]);
  const hasGridPos = rawRow !== null && rawCol !== null;

  const curRow = useMemo(() => rawRow ?? 1, [rawRow]);
  const curCol = useMemo(() => rawCol ?? 1, [rawCol]);

  /**
   * ✅ GRID NAV (3 cols x 3 rows)
   * - Prev/Next buttons MUST stay in the same row (no row jump)
   * - Up/Down end indicators based on same column neighbors
   */
  const nav = useMemo(() => {
    // fallback (only if grid coords missing)
    const fallbackPrev = index > 0 ? index - 1 : null;
    const fallbackNext = index < total - 1 ? index + 1 : null;

    if (!hasGridPos || !Array.isArray(orderedTopics) || orderedTopics.length === 0) {
      return {
        prevIndex: fallbackPrev,
        nextIndex: fallbackNext,
        upIndex: null,
        downIndex: null,
        leftEnd: fallbackPrev === null,
        rightEnd: fallbackNext === null,
        upEnd: true,
        downEnd: true,
        canPrev: fallbackPrev !== null,
        canNext: fallbackNext !== null,
      };
    }

    const rowItems = [];
    const colItems = [];

    for (let i = 0; i < orderedTopics.length; i++) {
      const t = orderedTopics[i];
      const r = getRow(t);
      const c = getCol(t);
      if (r === null || c === null) continue;

      if (r === curRow) rowItems.push({ c, idx: i });
      if (c === curCol) colItems.push({ r, idx: i });
    }

    rowItems.sort((a, b) => a.c - b.c);
    colItems.sort((a, b) => a.r - b.r);

    // nearest left/right in same row
    let prevInRow = null;
    let nextInRow = null;
    for (const it of rowItems) {
      if (it.c < curCol) prevInRow = it.idx;
      if (it.c > curCol && nextInRow === null) nextInRow = it.idx;
    }

    // nearest up/down in same column
    let upInCol = null;
    let downInCol = null;
    for (const it of colItems) {
      if (it.r < curRow) upInCol = it.idx;
      if (it.r > curRow && downInCol === null) downInCol = it.idx;
    }

    return {
      // ✅ STRICT row navigation (no fallback here -> prevents row jumping)
      prevIndex: prevInRow,
      nextIndex: nextInRow,

      // (not used as buttons right now, but computed for your grid)
      upIndex: upInCol,
      downIndex: downInCol,

      leftEnd: prevInRow === null,
      rightEnd: nextInRow === null,
      upEnd: upInCol === null,
      downEnd: downInCol === null,

      canPrev: prevInRow !== null,
      canNext: nextInRow !== null,
    };
  }, [orderedTopics, curRow, curCol, hasGridPos, index, total]);

  const { prevIndex, nextIndex, leftEnd, rightEnd, upEnd, downEnd, canPrev, canNext } = nav;

  // ✅ Scroll-reactive corner highlight (kept as-is)
  const [cornerOpacity, setCornerOpacity] = useState(0.9);
  const [cornerShift, setCornerShift] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const el = bodyRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = el.scrollTop || 0;
        setCornerOpacity(Math.max(0.25, 0.95 - y / 260));
        setCornerShift(Math.min(46, y / 6));
      });
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [isActive]);

  // ✅ Fix markdown images + relative URLs
  const resolvedContent = useMemo(
    () => resolveMarkdownAssetUrls(content, mdUrl),
    [content, mdUrl]
  );

  // ✅ Hide "Back to Content" for SQL Server cards only
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
  }, [isActive, subjectKey, resolvedContent, loading, error]);

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
      {/* ✅ Safety: markdown images/tables never break layout */}
      <style>{`
        .markdown-safe :where(img, video, iframe, svg) {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }
        .markdown-safe :where(table) {
          display: block;
          max-width: 100%;
          overflow-x: auto;
        }
        [data-subjectkey="sqlserver"] .markdown-safe img {
          width: 100% !important;
          max-height: 320px;
          object-fit: contain;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(2, 6, 23, 0.22);
          box-shadow: 0 10px 26px rgba(0,0,0,0.35);
          margin: 10px 0;
        }
        @media (min-width: 768px) {
          [data-subjectkey="sqlserver"] .markdown-safe img { max-height: 420px; }
        }
      `}</style>

      <div
        ref={cardRef}
        data-subjectkey={subjectKey}
        className={[
          "w-full max-w-[1040px] mx-auto h-full max-h-full",
          "flex flex-col overflow-hidden relative isolate",
          "rounded-[22px]",
          "[font-family:var(--card-font)]",
          "border border-slate-900/10 dark:border-white/12",
          "bg-white/78 dark:bg-slate-950/55",
          "backdrop-blur-[18px] backdrop-saturate-[190%]",

          "before:content-[''] before:absolute before:inset-[-2px] before:rounded-[24px] before:-z-10",
          "before:bg-[radial-gradient(900px_420px_at_18%_0%,rgba(99,102,241,0.30),transparent_60%),radial-gradient(820px_380px_at_92%_0%,rgba(56,189,248,0.22),transparent_64%),radial-gradient(900px_520px_at_50%_110%,rgba(16,185,129,0.14),transparent_55%)]",
          "before:blur-[18px] before:opacity-[0.55]",
          "dark:before:opacity-[0.78]",

          "after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:rounded-[22px]",
          "after:bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)]",
          "after:[background-size:26px_26px] after:opacity-[0.14]",
          "dark:after:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]",
          "dark:after:opacity-[0.10]",
        ].join(" ")}
      >
        {/* corner highlight */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full blur-[24px]"
          style={{
            opacity: isActive ? cornerOpacity : 0.25,
            transform: `translateY(${cornerShift}px)`,
            background:
              "radial-gradient(circle at 30% 30%, rgba(56,189,248,0.22), transparent 55%), radial-gradient(circle at 70% 40%, rgba(99,102,241,0.18), transparent 60%)",
          }}
        />

        {/* HEADER */}
        <div
          className={[
            "sticky top-0 z-30 relative",
            "px-3 md:px-4",
            "pt-2 pb-2",
            "border-b border-slate-900/8 dark:border-white/10",
            "backdrop-blur-[16px] backdrop-saturate-[200%]",
            "bg-white/70 dark:bg-slate-950/52",
          ].join(" ")}
        >
          <div
            className={[
              "pointer-events-none absolute left-0 right-0 bottom-0 h-[1px]",
              "bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.40),rgba(56,189,248,0.32),rgba(16,185,129,0.22),transparent)]",
              "opacity-[0.75] dark:opacity-[0.65]",
            ].join(" ")}
          />

          <div className="flex items-start justify-between gap-3">
            {/* LEFT */}
            <div className="min-w-0">
              <div className="text-[12px] md:text-[13px] leading-[1.12] font-[800] tracking-[0.04px] text-slate-900 dark:text-slate-100 truncate">
                {title}
              </div>

             {subjectLabel ? (
  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
    <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[9.5px] font-[750] text-slate-900/70 dark:text-slate-200/75 border border-slate-900/10 dark:border-white/10 bg-slate-900/[0.02] dark:bg-white/[0.05]">
      {/* ✅ green dot */}
      <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.18)]" />
      {subjectLabel}
    </span>
  </div>
) : null}

            </div>

            {/* RIGHT: buttons + grid indicator */}
            <div className="flex items-center gap-2 flex-none">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => canPrev && jump(prevIndex)}
                className={[
                  "h-8 w-8 rounded-full grid place-items-center",
                  "border border-slate-900/12 bg-white/76 text-slate-900",
                  "shadow-[0_8px_16px_rgba(17,24,39,0.10)]",
                  "transition-[transform,box-shadow,background] duration-150",
                  "hover:-translate-y-[1px] hover:shadow-[0_10px_18px_rgba(17,24,39,0.14)] active:translate-y-0",
                  "disabled:opacity-45 disabled:hover:translate-y-0",
                  "dark:bg-slate-900/55 dark:border-white/12 dark:text-slate-100 dark:shadow-[0_8px_16px_rgba(0,0,0,0.65)]",
                ].join(" ")}
                aria-label="Previous topic (same row)"
                title="Previous (same row)"
              >
                <FiChevronLeft size={11} />
              </button>

              <button
                type="button"
                disabled={!canNext}
                onClick={() => canNext && jump(nextIndex)}
                className={[
                  "h-8 w-8 rounded-full grid place-items-center",
                  "border border-slate-900/12 bg-white/76 text-slate-900",
                  "shadow-[0_8px_16px_rgba(17,24,39,0.10)]",
                  "transition-[transform,box-shadow,background] duration-150",
                  "hover:-translate-y-[1px] hover:shadow-[0_10px_18px_rgba(17,24,39,0.14)] active:translate-y-0",
                  "disabled:opacity-45 disabled:hover:translate-y-0",
                  "dark:bg-slate-900/55 dark:border-white/12 dark:text-slate-100 dark:shadow-[0_8px_16px_rgba(0,0,0,0.65)]",
                ].join(" ")}
                aria-label="Next topic (same row)"
                title="Next (same row)"
              >
                <FiChevronRight size={15} />
              </button>

              {/* ✅ GRID boundaries (3 cols x 3 rows) */}
              <NavPill leftEnd={leftEnd} rightEnd={rightEnd} upEnd={upEnd} downEnd={downEnd} />
            </div>
          </div>

          {/* dropdown */}
          {showTopicDropdown ? (
            <div className="mt-2 flex items-center gap-2">
              <select
                className={[
                  "h-[28px] px-3 rounded-full",
                  "text-[11px] font-[750]",
                  "w-full",
                  "border border-slate-900/12 bg-white/74 text-slate-900/90",
                  "cursor-pointer outline-none truncate",
                  "shadow-[0_6px_14px_rgba(17,24,39,0.08)]",
                  "focus:ring-4 focus:ring-indigo-500/15",
                  "dark:border-white/14 dark:bg-slate-900/55 dark:text-slate-100",
                ].join(" ")}
                value={index}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if (!Number.isFinite(idx)) return;
                  jump(idx);
                }}
              >
                {orderedTopics.map((t, idx) => (
                  <option key={`${subjectKey}-${t?.topic_name || "topic"}-${idx}`} value={idx}>
                    {t?.topic_name || `Topic ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* BODY */}
        <div
          ref={bodyRef}
          className={[
            "p-4 md:p-5",
            "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
            "overscroll-contain scrollbar-hide",
            "shadow-[inset_0_10px_14px_-14px_rgba(17,24,39,0.24),inset_0_-10px_14px_-14px_rgba(17,24,39,0.18)]",
            "dark:shadow-[inset_0_10px_14px_-14px_rgba(0,0,0,0.70),inset_0_-10px_14px_-14px_rgba(0,0,0,0.70)]",
          ].join(" ")}
        >
          {!isActive ? (
            <div className="relative p-3 overflow-hidden">
              <div
                className={[
                  "h-[260px] rounded-[16px] border border-slate-900/8 dark:border-white/10",
                  "bg-white/70 dark:bg-slate-900/30",
                ].join(" ")}
                aria-hidden="true"
              />
              <div
                className={[
                  "pointer-events-none absolute inset-0 opacity-[0.55]",
                  "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.34)_45%,transparent_80%)]",
                  "dark:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.10)_45%,transparent_80%)]",
                  "animate-mShimmer",
                ].join(" ")}
              />
            </div>
          ) : loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-[70%] rounded bg-slate-900/10 dark:bg-white/10" />
              <div className="h-4 w-[55%] rounded bg-slate-900/10 dark:bg-white/10" />
              <div className="h-4 w-[85%] rounded bg-slate-900/10 dark:bg-white/10" />
              <div className="h-4 w-[78%] rounded bg-slate-900/10 dark:bg-white/10" />
              <div className="h-4 w-[60%] rounded bg-slate-900/10 dark:bg-white/10" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-[16px] border border-red-500/20 bg-red-500/5 text-slate-900 dark:text-slate-100">
              <div className="font-[950]">Failed to load markdown</div>
              <div className="mt-1 text-[13px] opacity-80">{String(error)}</div>
            </div>
          ) : (
            <div className="markdown-safe">
              <MarkdownViewer content={resolvedContent} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
