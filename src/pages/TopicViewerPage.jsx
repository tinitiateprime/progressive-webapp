import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMarkdown } from "../hooks/useMarkdown";
import MarkdownViewer from "../markdown/MarkdownViewer";

export default function TopicViewerPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const mdUrl = params.get("md") || "";
  const title = params.get("title") || "Topic";
  const subject = params.get("subject") || "";

  const safeTitle = useMemo(() => decodeURIComponent(title), [title]);

  const { content, loading, error } = useMarkdown(mdUrl);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="max-w-[980px] mx-auto px-4 pt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-[12px] border border-black/15 bg-white font-extrabold hover:bg-black/5"
        >
          ← Back
        </button>

        <div>
          <div className="font-black text-[18px]">{safeTitle}</div>
          {subject ? <div className="text-[12px] opacity-75">Subject: {subject}</div> : null}
          <div className="text-[12px] opacity-60 mt-0.5">
            Source: {mdUrl ? "GitHub raw" : "Missing md_url"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-[980px] mx-auto p-6">
          <h3 className="font-black text-[18px]">Loading markdown…</h3>
        </div>
      ) : error ? (
        <div className="max-w-[980px] mx-auto p-6">
          <h3 className="font-black text-[18px]">Failed to load markdown</h3>
          <p className="text-red-600 font-bold">{String(error)}</p>
        </div>
      ) : (
        <div className="max-w-[980px] mx-auto px-4 py-4">
          <MarkdownViewer content={content} />
        </div>
      )}
    </div>
  );
}
