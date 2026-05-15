"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaHome, FaMoon, FaSearch, FaSun } from "react-icons/fa";
import CacheProgressBadge from "../../components/content/CacheProgressBadge";
import TickerBar from "../../components/content/TickerBar";
import { ThemeContext } from "../../context/ThemeContext";
import { useProtectedAppSession } from "../../lib/app-session";
import { fetchInterviewQuestions, fetchTickerItems } from "../../lib/content-client";
import type { InterviewQuestionSummary, TickerItem } from "../../lib/content-types";
import { goBackOr } from "../../lib/navigation";
import { buildInterviewCacheTargets, useCacheSaveProgress } from "../../lib/use-cache-save-progress";
import { useConnectionStatus } from "../../lib/use-connection-status";

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function InterviewIndexPage() {
  const router = useRouter();
  const { status } = useProtectedAppSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isOffline = useConnectionStatus();
  const [items, setItems] = useState<InterviewQuestionSummary[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const hasLoadedItemsRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        if (!hasLoadedItemsRef.current) {
          setLoading(true);
        }
        setError("");

        const results = await Promise.allSettled([
          fetchInterviewQuestions(controller.signal),
          fetchTickerItems(controller.signal),
        ]);

        if (cancelled) return;

        if (results[0].status === "fulfilled") {
          hasLoadedItemsRef.current = true;
          setItems(results[0].value);
        }
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
  const cacheTargets = useMemo(() => buildInterviewCacheTargets(items), [items]);
  const cacheProgress = useCacheSaveProgress(cacheTargets);

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
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <span
                  className="badge"
                  style={{
                    color: isOffline
                      ? "var(--status-offline-color)"
                      : "var(--status-online-color)",
                    background: isOffline
                      ? "var(--status-offline-background)"
                      : "var(--status-online-background)",
                    borderColor: isOffline
                      ? "var(--status-offline-border)"
                      : "var(--status-online-border)",
                  }}
                >
                  {isOffline ? "Offline" : "Online"}
                </span>
                {cacheProgress.total > 0 ? <CacheProgressBadge progress={cacheProgress} /> : null}
              </div>
            </div>

            <div className="page-hero-actions">
              <button className="btn btn-outline" onClick={() => goBackOr(router, "/dashboard")} type="button">
                <FaArrowLeft /> Back
              </button>
              <Link href="/dashboard" className="btn btn-outline" title="Home">
                <FaHome />
              </Link>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>

          {tickerItems.length > 0 && (
            <div className="desktop-ticker-slot" style={{ marginTop: 18 }}>
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
            <div className="card" style={{ padding: 18, borderRadius: 18, color: "var(--status-offline-color)" }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="content-grid">
              {filteredItems.map((item) => (
                <Link
                  key={item.slug}
                  href={{
                    pathname: "/interview/[slug]",
                    query: { slug: item.slug },
                  }}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card content-card">
                    <div className="content-card__tags" style={{ marginTop: 0 }}>
                      <span className="badge" style={{ fontSize: 11 }}>
                        {item.category}
                      </span>
                      <span className="badge" style={{ fontSize: 11 }}>
                        {item.level}
                      </span>
                    </div>

                    <div className="content-card__title" style={{ marginTop: 14 }}>{item.title}</div>

                    <div className="content-card__body">{item.question}</div>

                    <div className="content-card__meta">
                      {item.excerpt}
                    </div>

                    <div className="content-card__tags" style={{ marginTop: 14 }}>
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
