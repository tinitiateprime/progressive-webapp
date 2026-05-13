"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaArrowRight, FaMoon, FaSearch, FaSun } from "react-icons/fa";

import TickerBar from "../components/content/TickerBar";
import { ThemeContext } from "../context/ThemeContext";
import { fetchCourseSubjects, fetchTickerItems } from "../lib/content-client";
import type { CourseSubject, TickerItem } from "../lib/content-types";
import { buildPublicEntryUrl } from "../lib/public-entry";

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const getCourseInitials = (subject: string) =>
  subject
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";

const accentByCategory = (category: string) => {
  const normalized = normalizeSearch(category);

  if (normalized.includes("front")) {
    return {
      background: "var(--course-tone-frontend-background)",
      border: "var(--course-tone-frontend-border)",
      color: "var(--course-tone-frontend-color)",
    };
  }

  if (normalized.includes("data") || normalized.includes("database")) {
    return {
      background: "var(--course-tone-database-background)",
      border: "var(--course-tone-database-border)",
      color: "var(--course-tone-database-color)",
    };
  }

  if (normalized.includes("back")) {
    return {
      background: "var(--course-tone-backend-background)",
      border: "var(--course-tone-backend-border)",
      color: "var(--course-tone-backend-color)",
    };
  }

  if (normalized.includes("full")) {
    return {
      background: "var(--course-tone-full-stack-background)",
      border: "var(--course-tone-full-stack-border)",
      color: "var(--course-tone-full-stack-color)",
    };
  }

  return {
    background: "var(--course-tone-default-background)",
    border: "var(--course-tone-default-border)",
    color: "var(--course-tone-default-color)",
  };
};

export default function CoursesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [courses, setCourses] = useState<CourseSubject[]>([]);
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
          fetchCourseSubjects(controller.signal),
          fetchTickerItems(controller.signal),
        ]);

        if (cancelled) return;

        if (results[0].status === "fulfilled") setCourses(results[0].value);
        if (results[1].status === "fulfilled") setTickerItems(results[1].value);

        if (results[0].status === "rejected") {
          setError("Failed to load courses. Please try refreshing.");
        }
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError("Failed to load courses.");
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
  }, [status]);

  const filteredCourses = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return courses;

    return courses.filter((course) => {
      if (normalizeSearch(course.subject).includes(query)) return true;
      if (normalizeSearch(course.category).includes(query)) return true;
      if (normalizeSearch(course.level).includes(query)) return true;
      if (normalizeSearch(course.summary).includes(query)) return true;
      return course.topics.some((topic) => normalizeSearch(topic.topic_name).includes(query));
    });
  }, [courses, q]);

  return (
    <div className="app-shell">
      <main className="page-main">
        <div className="card page-hero-card">
          <div className="page-hero-top">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                COURSES
              </div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                Browse the subject library
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                Open any subject to continue into its topic reader.
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
            className="card search-bar-elevated page-hero-search"
            style={{ padding: "12px 14px", gap: 10 }}
          >
            <FaSearch />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search subjects, categories, levels, or topics..."
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
              Loading courses...
            </div>
          )}

          {!loading && error && (
            <div className="card" style={{ padding: 18, borderRadius: 18, color: "crimson" }}>
              {error}
            </div>
          )}

          {!loading && !error && filteredCourses.length === 0 && (
            <div className="card" style={{ padding: 18, borderRadius: 18 }}>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                {q ? "No course matched your search." : "No courses are available right now."}
              </div>
            </div>
          )}

          {!loading && !error && filteredCourses.length > 0 && (
            <div className="course-library-grid">
              {filteredCourses.map((course) => {
                const tone = accentByCategory(course.category);

                return (
                  <Link
                    key={course.slug}
                    href={{
                      pathname: `/subject/${encodeURIComponent(course.subject)}`,
                      query: { readme: course.readme_url },
                    }}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className="card course-library-card"
                      style={{
                        borderColor: tone.border,
                        background: "var(--course-card-bg)",
                      }}
                    >
                      <div
                        style={{
                          height: 5,
                          borderRadius: 999,
                          background: tone.background,
                        }}
                      />

                      <div className="course-library-card__header">
                        <div
                          className="course-library-card__icon-shell"
                          style={{
                            border: `1px solid ${tone.border}`,
                            background: tone.background,
                            color: tone.color,
                          }}
                        >
                          {course.icon_url ? (
                            <img src={course.icon_url} alt={`${course.subject} icon`} loading="lazy" />
                          ) : (
                            <span style={{ fontSize: 18, fontWeight: 900 }}>{getCourseInitials(course.subject)}</span>
                          )}
                        </div>

                        <div className="course-library-card__meta">
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderRadius: 999,
                              border: `1px solid ${tone.border}`,
                              background: tone.background,
                              fontSize: 11,
                              fontWeight: 800,
                              color: tone.color,
                            }}
                          >
                            {course.category}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "clamp(21px, 2.4vw, 26px)", fontWeight: 900, lineHeight: 1.2 }}>
                          {course.subject}
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                          }}
                          className="course-library-card__summary"
                        >
                          {course.summary}
                        </div>
                      </div>

                      {course.topics.length > 0 && (
                        <div>
                          <div style={{ marginTop: 12 }} className="course-library-card__topics">
                            {course.topics.slice(0, 3).map((topic) => (
                              <span key={topic.md_url} className="badge" style={{ fontSize: 10 }}>
                                {topic.topic_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="course-library-card__cta">
                        <span className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                          Open Subject <FaArrowRight />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export { requireAuthenticatedPage as getServerSideProps } from "../lib/require-auth-page";
