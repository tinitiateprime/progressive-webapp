"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { FaArrowLeft, FaMoon, FaPlayCircle, FaSun, FaVolumeUp } from "react-icons/fa";
import { MdOutlineSlideshow } from "react-icons/md";
import { ThemeContext } from "../../context/ThemeContext";
import { useAppSession } from "../../lib/app-session";
import { fetchCbtCollections } from "../../lib/content-client";
import type { CbtCollections } from "../../lib/content-types";
import { buildPublicEntryUrl } from "../../lib/public-entry";

type TabKey = "slideshows" | "trainingVideos" | "audioBooks";

const tabOrder: Array<{ key: TabKey; label: string }> = [
  { key: "slideshows", label: "Slideshows" },
  { key: "trainingVideos", label: "Training Videos" },
  { key: "audioBooks", label: "Audio Books" },
];

export default function CbtPage() {
  const router = useRouter();
  const { status } = useAppSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [tab, setTab] = useState<TabKey>("slideshows");
  const [data, setData] = useState<CbtCollections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setData(await fetchCbtCollections(controller.signal));
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError("Failed to load CBT content.");
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

  const slideItems = data?.slideshows || [];
  const trainingItems = data?.trainingVideos || [];
  const audioItems = data?.audioBooks || [];

  return (
    <div className="app-shell">
      <main className="page-main">
        <div className="card page-hero-card">
          <div className="page-hero-top">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>CBT HUB</div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                Slideshows, training videos, and audio books
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                Choose the format that fits your study session and continue from the collection you want.
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
        </div>

        <section style={{ marginTop: 18 }}>
          <div
            className="card content-tab-bar"
          >
            {tabOrder.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setTab(entry.key)}
                className={tab === entry.key ? "btn btn-primary" : "btn btn-outline"}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18 }}>
            Loading CBT content...
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ padding: 18, borderRadius: 18, marginTop: 18, color: "var(--status-offline-color)" }}>
            {error}
          </div>
        )}

        {!loading && !error && tab === "slideshows" && (
          <section
            className="content-grid"
            style={{
              marginTop: 18,
            }}
          >
            {slideItems.map((item) => (
              <Link
                key={item.slug}
                href={`/cbt/slides/${encodeURIComponent(item.slug)}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card content-card">
                  <div className="content-card__icon">
                    <MdOutlineSlideshow />
                  </div>
                  <div className="content-card__title" style={{ marginTop: 14 }}>{item.title}</div>
                  <div className="content-card__body">{item.summary}</div>
                  <div className="content-card__meta">
                    Audience: {item.audience}
                  </div>
                  <div className="content-card__tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="badge" style={{ fontSize: 10 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        {!loading && !error && tab !== "slideshows" && (
          <section
            className="content-grid"
            style={{
              marginTop: 18,
            }}
          >
            {(tab === "trainingVideos" ? trainingItems : audioItems).map((item) => (
              <Link
                key={item.slug}
                href={`/cbt/media/${encodeURIComponent(item.slug)}?kind=${encodeURIComponent(
                  tab === "trainingVideos" ? "training-videos" : "audio-books"
                )}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card content-card">
                  <div className="content-card__icon">
                    {tab === "trainingVideos" ? <FaPlayCircle /> : <FaVolumeUp />}
                  </div>
                  <div className="content-card__title" style={{ marginTop: 14 }}>{item.title}</div>
                  <div className="content-card__body">{item.summary}</div>
                  <div className="content-card__meta">
                    Speaker: {item.speaker}
                  </div>
                  <div className="content-card__tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="badge" style={{ fontSize: 10 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export { requireAuthenticatedPage as getServerSideProps } from "../../lib/require-auth-page";
