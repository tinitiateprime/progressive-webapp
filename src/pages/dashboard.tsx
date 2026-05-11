"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  FaArrowRight,
  FaBookOpen,
  FaLayerGroup,
  FaMoon,
  FaNewspaper,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUserTie,
} from "react-icons/fa";
import TickerBar from "../components/content/TickerBar";
import { ThemeContext } from "../context/ThemeContext";
import { clearBrowserSessionActive } from "../lib/browserSession";
import { fetchCourseSubjects, fetchTickerItems } from "../lib/content-client";
import type { CourseSubject, TickerItem } from "../lib/content-types";

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const moduleCards = [
  {
    title: "Interview QnA",
    description:
      "Architecture-style question and answer pages driven from markdown and catalog metadata.",
    href: "/interview",
    icon: <FaUserTie />,
    badge: "Markdown + JSON",
    external: false,
  },
  {
    title: "Courses",
    description:
      "Subject catalog powered by the new course source folder, while reusing the existing course repos for topics.",
    href: "#courses",
    icon: <FaBookOpen />,
    badge: "README-driven",
    external: true,
  },
  {
    title: "CBT",
    description:
      "Slideshows, training videos, and audio-book collections from separate source folders.",
    href: "/cbt",
    icon: <FaLayerGroup />,
    badge: "CBT Hub",
    external: false,
  },
  {
    title: "News Ticker",
    description:
      "Jobs, trending technologies, and TinitiateAI events from a dedicated ticker feed.",
    href: "#news-ticker",
    icon: <FaNewspaper />,
    badge: "Live strip",
    external: true,
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [courses, setCourses] = useState<CourseSubject[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [ticker, courseSubjects] = await Promise.all([
          fetchTickerItems(controller.signal),
          fetchCourseSubjects(controller.signal),
        ]);

        setTickerItems(ticker);
        setCourses(courseSubjects);
      } catch {
        setError("Failed to load the new content dashboard.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [status]);

  const filteredCourses = useMemo(() => {
    const query = normalizeSearch(q);
    if (!query) return courses;

    return courses.filter((course) => {
      if (normalizeSearch(course.subject).includes(query)) return true;
      if (normalizeSearch(course.category).includes(query)) return true;
      return course.topics.some((topic) => normalizeSearch(topic.topic_name).includes(query));
    });
  }, [courses, q]);

  const handleLogout = async () => {
    clearBrowserSessionActive();

    try {
      await signOut({ redirect: false });
    } catch {
      // ignore
    }

    router.replace("/login");
  };

  const logoSrc = theme === "dark" ? "/TinitiateLogo.png" : "/TinitiateLogoLight.png";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          theme === "dark"
            ? "radial-gradient(1000px 520px at 15% -10%, rgba(34,197,94,0.12), transparent 60%), radial-gradient(900px 540px at 100% 0%, rgba(37,99,235,0.18), transparent 55%), linear-gradient(180deg, #020617, #0f172a)"
            : "radial-gradient(1000px 520px at 15% -10%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(900px 540px at 100% 0%, rgba(37,99,235,0.12), transparent 55%), linear-gradient(180deg, #f8fafc, #ffffff)",
      }}
    >
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 16px 32px" }}>
        <div className="card" style={{ padding: 18, borderRadius: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <img
                src={logoSrc}
                alt="Tinitiate"
                style={{ width: 210, maxWidth: "60vw", height: "auto", objectFit: "contain" }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  TIAI Edu App Planner Build
                </div>
                <div style={{ marginTop: 4, fontSize: 14, color: "var(--muted)" }}>
                  One dashboard for Interview QnA, Courses, CBT, and source-driven updates.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button className="btn btn-outline" onClick={toggleTheme} type="button">
                {theme === "dark" ? <FaSun /> : <FaMoon />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>

              <button className="btn btn-outline" onClick={handleLogout} type="button">
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            <div
              className="soft"
              style={{
                padding: 16,
                borderRadius: 20,
                background:
                  theme === "dark"
                    ? "linear-gradient(180deg, rgba(15,23,42,0.8), rgba(2,6,23,0.7))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.78))",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                ACTIVE USER
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>
                {session?.user?.name || session?.user?.email || "Learner"}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                Authenticated dashboard for the new source-driven education structure.
              </div>
            </div>

            <div
              className="soft"
              style={{
                padding: 16,
                borderRadius: 20,
                background:
                  theme === "dark"
                    ? "linear-gradient(180deg, rgba(15,23,42,0.8), rgba(2,6,23,0.7))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.78))",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                CONTENT SOURCES
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>1 GitHub content repo</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                `interview-qna`, `courses`, `slideshows`, `training-videos`, `audio-books`, and `news-ticker` are now fetched from the GitHub content repository.
              </div>
            </div>

            <div
              className="soft"
              style={{
                padding: 16,
                borderRadius: 20,
                background:
                  theme === "dark"
                    ? "linear-gradient(180deg, rgba(15,23,42,0.8), rgba(2,6,23,0.7))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.78))",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                NETWORK
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>
                {isOffline ? "Offline" : "Online"}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                The app fetches manifests from the content repository and uses linked course markdown from GitHub.
              </div>
            </div>
          </div>
        </div>

        <section id="news-ticker" style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
            NEWS TICKER
          </div>
          <TickerBar items={tickerItems} />
        </section>

        <section style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
            MODULES
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 14,
            }}
          >
            {moduleCards.map((card) => {
              const content = (
                <div
                  className="card"
                  style={{
                    padding: 18,
                    borderRadius: 22,
                    height: "100%",
                    background:
                      theme === "dark"
                        ? "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.72))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.8))",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--border)",
                      fontSize: 16,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>{card.title}</div>
                    <span className="badge" style={{ fontSize: 10 }}>
                      {card.badge}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>
                    {card.description}
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 800,
                      color: "var(--brand-2)",
                    }}
                  >
                    Open <FaArrowRight />
                  </div>
                </div>
              );

              if (card.external) {
                return (
                  <a key={card.title} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
                    {content}
                  </a>
                );
              }

              return (
                <Link key={card.title} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div
            className="card"
            style={{
              padding: 18,
              borderRadius: 22,
              background:
                theme === "dark"
                  ? "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.72))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.8))",
            }}
          >
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
                HOW NEW CONTENT FLOWS
              </div>
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {[
                "Add markdown or metadata inside the matching folder in the GitHub content repository.",
                "Update the folder catalog JSON when a new item is added.",
                "The app loads normalized data through `/api/content/*` routes.",
                "UI pages render the new item without hardcoded page updates.",
              ].map((step) => (
                <div key={step} className="soft" style={{ padding: 14, borderRadius: 18 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="courses" style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>COURSES</div>
              <div style={{ marginTop: 4, fontSize: 14, color: "var(--muted)" }}>
                Source manifest: `courses/catalog.json` in the GitHub content repository. Topic order still comes from the subject `README.md`.
              </div>
            </div>

            <div className="card" style={{ padding: "10px 12px", minWidth: 280, display: "flex", alignItems: "center", gap: 10 }}>
              <FaSearch />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search subjects or topic names..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--text)",
                }}
              />
            </div>
          </div>

          {loading && (
            <div className="card" style={{ padding: 18, borderRadius: 18 }}>
              Loading course catalog...
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
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              {filteredCourses.map((course) => {
                const matchingTopics = q.trim()
                  ? course.topics
                      .filter((topic) =>
                        normalizeSearch(topic.topic_name).includes(normalizeSearch(q))
                      )
                      .slice(0, 3)
                  : course.topics.slice(0, 3);

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
                      className="card"
                      style={{
                        padding: 18,
                        borderRadius: 22,
                        height: "100%",
                        background:
                          theme === "dark"
                            ? "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.72))"
                            : "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.8))",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            {course.category}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>
                            {course.subject}
                          </div>
                        </div>
                        <span className="badge" style={{ fontSize: 11, alignSelf: "flex-start" }}>
                          {course.topics.length} topics
                        </span>
                      </div>

                      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>
                        {course.summary}
                      </div>

                      <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                        Level: {course.level}
                      </div>

                      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                        {matchingTopics.map((topic) => (
                          <div key={topic.md_url} className="soft" style={{ padding: "8px 10px", borderRadius: 14, fontSize: 12 }}>
                            {topic.topic_name}
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 800,
                          color: "var(--brand-2)",
                        }}
                      >
                        Open course <FaArrowRight />
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
