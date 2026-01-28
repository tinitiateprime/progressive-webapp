"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { FaArrowLeft, FaMoon, FaSun } from "react-icons/fa";

type FavTopic = {
  slug: string;
  topic_name: string;
  subject: string;
};

const FAVORITES_API = "/api/favorites";

export default function FavoritesPage() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [favorites, setFavorites] = useState<FavTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadFavorites = async () => {
    try {
      setErr("");
      const res = await fetch(FAVORITES_API, { cache: "no-store" });
      const data = await res.json();
      setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
    } catch (e: any) {
      console.error("Failed to load favorites:", e);
      setErr(e?.message || "Failed to load favorites");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Topbar */}
      <div
        className="card"
        style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}
      >
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
            <Link href="/dashboard" className="btn btn-outline">
              <FaArrowLeft /> Back
            </Link>

            <div>
              <div style={{ fontWeight: 800 }}>Favorites</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {favorites.length} item{favorites.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <button className="btn btn-outline" onClick={toggleTheme} type="button">
            {theme === "dark" ? <FaSun /> : <FaMoon />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>
        {loading && (
          <div className="card" style={{ padding: 18 }}>
            Loading…
          </div>
        )}

        {!loading && err && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ color: "crimson", fontWeight: 700 }}>Error</div>
            <div style={{ marginTop: 6, fontSize: 13, whiteSpace: "pre-wrap" }}>
              {err}
            </div>
          </div>
        )}

        {!loading && !err && favorites.length === 0 && (
          <div className="card" style={{ padding: 18 }}>
            No favorites yet. Go to any Subject page and click ⭐ to add topics.
          </div>
        )}

        {!loading && !err && favorites.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {favorites.map((f) => {
              const openHref = `/topic/${encodeURIComponent(
                f.topic_name
              )}?subject=${encodeURIComponent(f.subject)}`;

              return (
                <Link
                  key={f.slug}
                  href={openHref}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
                      {f.subject.toUpperCase()}
                    </div>

                    <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900 }}>
                      {f.topic_name}
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="badge"
                        style={{
                          borderColor: "rgba(250,204,21,0.35)",
                          color: "var(--brand)",
                        }}
                      >
                        Favorite
                      </span>

                      <span style={{ fontWeight: 800, color: "var(--brand-2)" }}>
                        Open →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
