"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ThemeContext } from "../context/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";

type CatalogTopic = { topic_name: string; md_url: string };
type CatalogSubject = { subject: string; topics: CatalogTopic[] };

/** Convert GitHub blob URL -> raw URL (required for fetch) */
const toRawGithub = (u: string) => {
  const m = u.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
  if (!m) return u;
  const [, owner, repo, branch, path] = m;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};

/** Extract first URL from a string; also convert blob->raw if needed */
const extractUrl = (text: string) => {
  const m = text.match(/\bhttps?:\/\/[^\s)]+/);
  if (!m) return "";
  let url = m[0].replace(/[)\],]+$/g, "");
  if (url.includes("github.com/") && url.includes("/blob/")) url = toRawGithub(url);
  return url;
};

const cleanTitle = (s: string) =>
  s
    .replace(/\s*\*\s*https?:\/\/.*$/i, "")
    .replace(/\s*https?:\/\/.*$/i, "")
    .trim();

/**
 * ✅ Parses YOUR README format:
 *
 * Subject:
 *   ## Vue JS
 *
 * Topics:
 *   ### Introduction
 *   https://raw....
 */
const parseCatalogFromReadme = (md: string): CatalogSubject[] => {
  const text = (md || "").replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const map = new Map<string, CatalogSubject>();
  const ensureSubject = (name: string) => {
    const key = cleanTitle(name);
    if (!map.has(key)) map.set(key, { subject: key, topics: [] });
    return map.get(key)!;
  };

  let currentSubject: CatalogSubject | null = null;

  const addTopic = (sub: CatalogSubject, topic_name: string, md_url: string) => {
    const tn = cleanTitle(topic_name);
    const url = md_url.trim();
    if (!tn || !url) return;
    if (sub.topics.some((t) => t.topic_name === tn)) return;
    sub.topics.push({ topic_name: tn, md_url: url });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // SUBJECT: "## Vue JS" but ignore "## Catalog 1"
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      const heading = h2[1].trim();
      if (/^catalog\s*\d*/i.test(heading)) continue; // ignore "Catalog 1/2/3"
      currentSubject = ensureSubject(heading);
      continue;
    }

    // TOPIC: "### Introduction" and URL usually next line
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      if (!currentSubject) continue;

      const topicTitle = h3[1].trim();

      // URL can be on same line OR next lines until next heading
      let url = extractUrl(line);

      if (!url) {
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j];

          // stop if next heading starts
          if (/^#{1,6}\s+/.test(next)) break;

          const candidate = extractUrl(next);
          if (candidate) {
            url = candidate;
            break;
          }
        }
      }

      if (url) addTopic(currentSubject, topicTitle, url);
      continue;
    }
  }

  return Array.from(map.values()).filter((s) => s.subject && (s.topics?.length ?? 0) > 0);
};

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [isOffline, setIsOffline] = useState(false);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
    // ✅ ONLY this README link
    const readmeBlob =
      "https://github.com/tinitiateprime/tinitiate_it_traning_app/blob/main/README.md";
    const readmeRaw = toRawGithub(readmeBlob);

    fetch(readmeRaw)
      .then((r) => {
        if (!r.ok) throw new Error(`README fetch failed (HTTP ${r.status})`);
        return r.text();
      })
      .then((mdText) => {
        const parsed = parseCatalogFromReadme(mdText);
        if (!parsed.length) {
          throw new Error('No catalog found in README (expected "## Subject" + "### Topic" + URL line)');
        }
        setSubjects(parsed);
        setLoading(false);
      })
      .catch((e: any) => {
        setErr(e?.message || "Failed to load catalog");
        setLoading(false);
      });
  }, []);

  // optional: prefetch first few subject routes (also uses router so it’s not unused)
  useEffect(() => {
    if (!subjects.length) return;
    subjects.slice(0, 6).forEach((s) => {
      router.prefetch?.(`/subject/${encodeURIComponent(s.subject)}`);
    });
  }, [subjects, router]);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Topbar (docs-site style) */}
      <div className="card" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/favicon_new.png" alt="Tinitiate" style={{ width: 34, height: 34, borderRadius: 10 }} />
            <div>
              <div style={{ fontWeight: 800 }}>Tutorial Dashboard</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Pick a subject like a docs site</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge">{isOffline ? "Offline" : "Online"}</span>
            <button className="btn btn-outline" onClick={toggleTheme} type="button">
              {theme === "dark" ? <FaSun /> : <FaMoon />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>
        {loading && (
          <div className="card" style={{ padding: 18 }}>
            Loading…
          </div>
        )}

        {!loading && err && (
          <div className="card" style={{ padding: 18, color: "crimson" }}>
            {err}
          </div>
        )}

        {!loading && !err && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {subjects.map((s) => (
              <Link
                key={s.subject}
                href={`/subject/${encodeURIComponent(s.subject)}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, textTransform: "capitalize" }}>{s.subject}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                    {s.topics?.length || 0} topics
                  </div>

                  <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge" style={{ borderColor: "rgba(22,163,74,0.35)", color: "var(--brand)" }}>
                      Start
                    </span>
                    <span style={{ fontWeight: 800, color: "var(--brand-2)" }}>Open →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}