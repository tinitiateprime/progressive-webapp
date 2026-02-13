// File: src/components/catalog/SubjectSection.jsx
import { useMemo, useState } from "react";
import { groupTopicsIntoRows } from "../../utils/catalogLayout";
import TopicRow from "./TopicRow";

const SUBJECT_LABELS = {
  vuejs: "Vue.js",
  nextjs: "Next.js",
  sqlserver: "SQL Server",
};

function prettySubject(subject) {
  const key = String(subject || "").toLowerCase();
  if (SUBJECT_LABELS[key]) return SUBJECT_LABELS[key];

  return String(subject || "Subject")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SubjectSection({ subjectItem }) {
  const { subject, subject_icon, topics = [], grid } = subjectItem || {};
  const [iconOk, setIconOk] = useState(true);

  const label = prettySubject(subject);

  const cols = useMemo(() => {
    const c = Number(grid?.cols);
    return Number.isFinite(c) && c > 0 ? c : 3;
  }, [grid]);

  // ✅ EXACT row layout (Row 1, Row 2, Row 3...)
  const rows = useMemo(() => groupTopicsIntoRows(topics, cols), [topics, cols]);

  return (
    <section
      className={[
        "rounded-[20px] overflow-hidden",
        "border border-slate-900/10 dark:border-white/12",
        "[background:radial-gradient(800px_260px_at_20%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(700px_240px_at_90%_0%,rgba(56,189,248,0.10),transparent_62%),rgba(255,255,255,0.92)]",
        "dark:[background:radial-gradient(800px_260px_at_20%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(700px_240px_at_90%_0%,rgba(56,189,248,0.16),transparent_62%),rgba(15,23,42,0.90)]",
        "shadow-[0_18px_45px_rgba(17,24,39,0.10),0_2px_10px_rgba(17,24,39,0.05)]",
        "dark:shadow-[0_18px_45px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.35)]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-4 border-b border-slate-900/10 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-[12px] backdrop-saturate-[180%]">
        <div className="flex items-center gap-3 min-w-0">
          {subject_icon && iconOk ? (
            <img
              className="w-10 h-10 rounded-xl object-cover flex-none border border-slate-900/10 dark:border-white/12"
              src={subject_icon}
              alt={`${label} icon`}
              onError={() => setIconOk(false)}
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl grid place-items-center font-[900] border border-slate-900/10 dark:border-white/12 bg-white/70 dark:bg-slate-900/60 text-slate-900 dark:text-slate-200">
              {label.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-[15px] md:text-[16px] font-[850] text-slate-900 dark:text-slate-100 truncate">
              {label}
            </h2>
            <div className="text-[12px] font-[650] text-slate-900/60 dark:text-slate-200/60">
              {topics.length} topic{topics.length === 1 ? "" : "s"} • {rows.length} row
              {rows.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <span className="hidden md:inline-flex px-3 py-1 rounded-full text-[12px] font-[750] border border-slate-900/10 bg-white/60 text-slate-900/70 dark:border-white/12 dark:bg-white/5 dark:text-slate-200/70">
          {cols} cols
        </span>
      </div>

      {/* Rows */}
      <div className="p-4 md:p-5 space-y-4">
        {rows.map((r) => (
          <TopicRow
            key={`${subject}-row-${r.row}`}
            rowNumber={r.row}
            topics={r.topics}
            cols={cols}
            showRowLabel={false}
          />
        ))}
      </div>
    </section>
  );
}
