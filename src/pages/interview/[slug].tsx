"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaArrowLeft, FaMoon, FaSun } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeContext";
import { fetchInterviewQuestion } from "../../lib/content-client";
import type { InterviewQuestionDetail } from "../../lib/content-types";

export default function InterviewDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [item, setItem] = useState<InterviewQuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated" || typeof slug !== "string") return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        setItem(null);

        const nextItem = await fetchInterviewQuestion(slug, controller.signal);
        if (cancelled) return;

        setItem(nextItem);
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError("Failed to load the interview answer.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug, status]);

  return (
    <div className="app-shell">
      <main className="page-main page-main--narrow">
        <div className="card page-hero-card">
          <div className="page-hero-top">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                INTERVIEW QUESTION DETAIL
              </div>
              <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>
                {item?.title || "Loading question..."}
              </div>
            </div>

            <div className="page-hero-actions">
              <Link href="/interview" className="btn btn-outline">
                <FaArrowLeft /> Back to QnA
              </Link>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18 }}>
            Loading answer...
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18, color: "crimson" }}>
            {error}
          </div>
        )}

        {!loading && item && (
          <>
            <section style={{ marginTop: 18 }}>
              <div className="card" style={{ padding: 18, borderRadius: 22 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="badge">{item.category}</span>
                  <span className="badge">{item.level}</span>
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge" style={{ fontSize: 10 }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
                  INTERVIEW QUESTION
                </div>
                <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.7 }}>{item.question}</div>
              </div>
            </section>

            <section style={{ marginTop: 18 }}>
              <div className="card" style={{ padding: 22, borderRadius: 22 }}>
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.markdown}</ReactMarkdown>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export { requireAuthenticatedPage as getServerSideProps } from "../../lib/require-auth-page";
