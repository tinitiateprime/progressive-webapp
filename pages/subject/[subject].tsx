"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import styles from "../subject/subjectPage.module.css"; // Import as a CSS module

interface Topics {
  [key: string]: string;
}

function normalizeRawUrl(url: string) {
  return String(url).replace(
    "https://raw.github.com/",
    "https://raw.githubusercontent.com/"
  );
}

export default function SubjectPage() {
  const router = useRouter();
  const { subject } = router.query;

  const subjectStr = Array.isArray(subject) ? subject[0] : subject;

  const [topics, setTopics] = useState<Topics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cacheKey = subjectStr ? `md-cache-${subjectStr}` : "";

  useEffect(() => {
    if (!subjectStr) return;

    localStorage.setItem("last-subject", String(subjectStr));

    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setTopics(JSON.parse(cached));
          setLoading(false);
          return;
        } catch {}
      }
    }

    fetch("/data.json")
      .then((res) => res.json())
      .then(async (data) => {
        const subj = data.subjects?.[subjectStr];
        if (!subj) throw new Error("Subject not found in data.json");

        const fetchedTopics: Topics = {};
        for (const [topicName, url] of Object.entries<string>(subj)) {
          try {
            const u = normalizeRawUrl(url);
            const r = await fetch(u);
            if (!r.ok) continue;
            fetchedTopics[topicName] = await r.text();
          } catch (e) {
            console.error("Fetch failed:", topicName, e);
          }
        }

        localStorage.setItem(cacheKey, JSON.stringify(fetchedTopics));
        setTopics(fetchedTopics);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load subject.");
        setLoading(false);
      });
  }, [subjectStr, cacheKey]);

  const Header = () => (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src="/favicon_new.png" alt="Logo" className={styles.logo} />
        <div className={styles.brandText}>
          <div className={styles.brandTitle}>{subjectStr || "Learning"}</div>
          <div className={styles.brandSub}>Docs • Topics • Notes</div>
        </div>
      </div>
    </header>
  );

  if (loading || error) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.center}>
          <div className={styles.centerCard}>
            <div className={styles.centerTitle}>
              {loading ? "Loading topics..." : "Oops"}
            </div>
            <div className={styles.centerMsg}>{error || "Please wait…"}</div>

            {error ? (
              <button className={styles.btn} onClick={() => router.push("/")}>
                Go Home
              </button>
            ) : null}
          </div>
        </main>

        <footer className={styles.footer}>© 2026 My Learning Site</footer>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.shell}>
        <div className={styles.grid}>
          {Object.keys(topics).map((t, idx) => (
            <button
              key={t}
              className={styles.card}
              onClick={() =>
                router.push(
                  `/topic/${encodeURIComponent(t)}?subject=${encodeURIComponent(
                    String(subjectStr)
                  )}`
                )
              }
            >
              <div className={styles.cardTop}>
                <span className={styles.index}>{idx + 1}</span>
                <span className={styles.title}>{t}</span>
              </div>

              <p className={styles.preview}>
                {(topics[t] || "").replace(/\n/g, " ").slice(0, 120)}...
              </p>

              <div className={styles.openRow}>
                <span className={styles.openText}>Open</span>
                <span className={styles.arrow}>→</span>
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© 2026 My Learning Site</span>
        <span className={styles.footerDot}>•</span>
        <span className={styles.footerMuted}>Built for fast learning</span>
      </footer>
    </div>
  );
}
