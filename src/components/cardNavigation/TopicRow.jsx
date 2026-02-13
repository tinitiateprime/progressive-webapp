// File: src/components/catalog/TopicRow.jsx
import TopicCard from "./TopicCard";

const COL_CLASS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export default function TopicRow({ rowNumber, topics = [], cols = 3, showRowLabel = false }) {
  const gridCols = COL_CLASS[cols] || "md:grid-cols-3";

  return (
    <div className="w-full">
      {showRowLabel ? (
        <div className="mb-2 text-[12px] font-[800] text-slate-900/60 dark:text-slate-200/60">
          Row {rowNumber}
        </div>
      ) : null}

      <div className={["grid grid-cols-1 sm:grid-cols-2", gridCols, "gap-3"].join(" ")}>
        {topics.map((t, i) => (
          <TopicCard key={`${t?.topic_name || "topic"}-${i}`} topic={t} />
        ))}
      </div>
    </div>
  );
}
