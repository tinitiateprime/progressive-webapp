import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMarkdown } from "../hooks/useMarkdown";
import MarkdownViewer from "../markdown/MarkdownViewer2";

export default function TopicViewerPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const mdUrl = params.get("md") || "";
  const title = params.get("title") || "Topic";
  const subject = params.get("subject") || "";

  const safeTitle = useMemo(() => decodeURIComponent(title), [title]);

  const { content, loading, error } = useMarkdown(mdUrl);

  return (
    <div>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "18px 16px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "white",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          ← Back
        </button>

        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{safeTitle}</div>
          {subject ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>Subject: {subject}</div>
          ) : null}
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            Source: {mdUrl ? "GitHub raw" : "Missing md_url"}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
          <h3>Loading markdown…</h3>
        </div>
      ) : error ? (
        <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
          <h3>Failed to load markdown</h3>
          <p style={{ color: "crimson", fontWeight: 700 }}>{error}</p>
        </div>
      ) : (
        <MarkdownViewer content={content} />
      )}
    </div>
  );
}
