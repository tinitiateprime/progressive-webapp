"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import FavButton from "../../components/FavButton";

const repoUrls: Record<string, string> = {
  vuejs: "https://raw.githubusercontent.com/Eswar-521/Vue-Js/main/vuejs-tutorial/README.md",
  nextjs: "https://raw.githubusercontent.com/Eswar-521/Vue-Js/main/nextjs-tutorial/README.md",
};

export default function RepoPage() {
  const router = useRouter();
  const { slug } = router.query; // dynamic segment

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const url = repoUrls[slug as string];
    if (!url) return;

    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      });
  }, [slug]);

  if (!slug) return <p>Loading...</p>;
  if (!repoUrls[slug as string]) return <p>Repository not found</p>;

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: 900,
        margin: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            color: "#202124",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {slug?.toString().toUpperCase()} Tutorial
        </h1>
        <FavButton item={`${slug}-tutorial`} />
      </div>

      {/* Markdown Container */}
      <div
        style={{
          padding: 30,
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          lineHeight: 1.6,
        }}
      >
        {loading ? (
          <p style={{ color: "#5f6368", textAlign: "center" }}>Loading...</p>
        ) : (
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  style={{ fontSize: "24px", marginBottom: 15, color: "#0070f3" }}
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  style={{ fontSize: "20px", marginBottom: 12, color: "#202124" }}
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  style={{ fontSize: "18px", marginBottom: 10, color: "#202124" }}
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p style={{ marginBottom: 12, color: "#5f6368" }} {...props} />
              ),
              code: ({ node, ...props }) => (
                <code
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                    fontSize: "14px",
                  }}
                  {...props}
                />
              ),
              pre: ({ node, ...props }) => (
                <pre
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: 15,
                    borderRadius: 8,
                    overflowX: "auto",
                  }}
                  {...props}
                />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
 