// File: src/components/catalog/TopicCard.jsx
import { useNavigate } from "react-router-dom";

export default function TopicCard({ topic }) {
  const navigate = useNavigate();

  const openTopic = () => {
    const md = topic?.md_url;
    if (!md) return;

    const params = new URLSearchParams();
    params.set("md", md);
    params.set("title", topic?.topic_name || "Topic");

    navigate(`/topic?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={openTopic}
      className={[
        "group relative w-full text-left overflow-hidden rounded-[18px]",
        "border border-slate-900/10 dark:border-white/12",
        "bg-white/85 dark:bg-slate-900/55",
        "shadow-[0_14px_34px_rgba(17,24,39,0.10)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]",
        "transition-[transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-[2px] hover:shadow-[0_18px_45px_rgba(17,24,39,0.14)]",
        "dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.60)]",
        "focus:outline-none focus:ring-4 focus:ring-indigo-500/20",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -inset-10 opacity-60 blur-2xl
        [background:radial-gradient(360px_180px_at_20%_0%,rgba(99,102,241,0.20),transparent_60%),radial-gradient(360px_180px_at_90%_0%,rgba(56,189,248,0.18),transparent_62%)]" />

      <div className="relative p-4">
        <div className="text-[13px] md:text-[14px] font-[850] text-slate-900 dark:text-slate-100 leading-snug">
          {topic?.topic_name || "Untitled Topic"}
        </div>
        <div className="mt-2 text-[12px] font-[700] text-slate-900/55 dark:text-slate-200/55">
          Open →
        </div>
      </div>
    </button>
  );
}
