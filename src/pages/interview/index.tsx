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
import { buildPublicEntryUrl } from "../../lib/public-entry";

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
      router.replace(buildPublicEntryUrl(router.asPath));
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          fetchInterviewQuestions(controller.signal),
          fetchTickerItems(controller.signal),
        ]);

        if (cancelled) return;

        if (results[0].status === "fulfilled") setItems(results[0].value);
        if (results[1].status === "fulfilled") setTickerItems(results[1].value);

        if (results[0].status === "rejected" && !cancelled) {
          setError("Failed to load interview content. Please try refreshing.");
        }
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError("Failed to load interview content.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
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
    <div className="app-shell">
      <main className="page-main">
        <div className="card page-hero-card">
          <div className="page-hero-top">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                INTERVIEW QNA
              </div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                Practice high-signal interview answers
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                Review concise explanations, key concepts, and likely follow-up areas.
              </div>
            </div>

            <div className="page-hero-actions">
              <Link href="/dashboard" className="btn btn-outline">
                <FaArrowLeft /> Dashboard
              </Link>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>

          {tickerItems.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <TickerBar items={tickerItems} />
            </div>
          )}
        </div>

        <section style={{ marginTop: 20 }}>
          <div
            className="card page-hero-search"
            style={{ padding: "12px 14px", gap: 10 }}
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

export { requireAuthenticatedPage as getServerSideProps } from "../../lib/require-auth-page";
