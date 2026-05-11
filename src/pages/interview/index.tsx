"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaMoon, FaSearch, FaSun } from "react-icons/fa";
import TickerBar from "../../components/content/TickerBar";
import { ThemeContext } from "../../context/ThemeContext";
import { fetchInterviewQuestions, fetchTickerItems } from "../../lib/content-client";
import type { InterviewQuestionSummary, TickerItem } from "../../lib/content-types";

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function InterviewIndexPage() {
  const router = useRouter();
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [items, setItems] = useState<InterviewQuestionSummary[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [questions, ticker] = await Promise.all([
          fetchInterviewQuestions(controller.signal),
          fetchTickerItems(controller.signal),
        ]);

        setItems(questions);
        setTickerItems(ticker);
      } catch {
        setError("Failed to load interview content.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [status]);

  const filteredItems = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return items;

    return items.filter((item) => {
      if (normalizeSearch(item.title).includes(query)) return true;
      if (normalizeSearch(item.category).includes(query)) return true;
      if (normalizeSearch(item.level).includes(query)) return true;
      if (normalizeSearch(item.question).includes(query)) return true;
      return item.tags.some((tag) => normalizeSearch(tag).includes(query));
    });
  }, [items, q]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          theme === "dark"
            ? "linear-gradient(180deg, #020617, #0f172a)"
            : "linear-gradient(180deg, #f8fafc, #ffffff)",
      }}
    >
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 16px 32px" }}>
        <div className="card" style={{ padding: 18, borderRadius: 22 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                INTERVIEW QNA
              </div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                Architecture-form answers from markdown
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                Source folder: `interview-qna` in the GitHub content repository
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/dashboard" className="btn btn-outline">
                <FaArrowLeft /> Dashboard
              </Link>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <TickerBar items={tickerItems} />
          </div>
        </div>

        <section style={{ marginTop: 20 }}>
          <div
            className="card"
            style={{
              padding: 16,
              borderRadius: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {[
              "Add one markdown file per question.",
              "Register the question in `catalog.json`.",
              "The list page reads the catalog, and the detail page reads the markdown answer.",
            ].map((note) => (
              <div key={note} className="soft" style={{ padding: 14, borderRadius: 16 }}>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{note}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 20 }}>
          <div
            className="card"
            style={{
              padding: "12px 14px",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FaSearch />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search questions, category, level, or tags..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text)",
              }}
            />
          </div>
        </section>

        <section style={{ marginTop: 20 }}>
          {loading && (
            <div className="card" style={{ padding: 18, borderRadius: 18 }}>
              Loading interview questions...
            </div>
          )}

          {!loading && error && (
            <div className="card" style={{ padding: 18, borderRadius: 18, color: "crimson" }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {filteredItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/interview/${encodeURIComponent(item.slug)}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card" style={{ padding: 18, borderRadius: 22, height: "100%" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span className="badge" style={{ fontSize: 11 }}>
                        {item.category}
                      </span>
                      <span className="badge" style={{ fontSize: 11 }}>
                        {item.level}
                      </span>
                    </div>

                    <div style={{ marginTop: 14, fontSize: 22, fontWeight: 900, lineHeight: 1.3 }}>
                      {item.title}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                      {item.question}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                      {item.excerpt}
                    </div>

                    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {item.tags.map((tag) => (
                        <span key={tag} className="badge" style={{ fontSize: 10 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
