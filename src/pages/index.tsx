"use client";

import { useRouter } from "next/router";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { FaMoon, FaSun, FaArrowRight } from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="min-h-screen px-5">
      {/* Topbar */}
      <header className="mx-auto max-w-6xl pt-6">
        <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon_new.png" alt="Tinitiate" className="h-9 w-9 rounded-xl" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">Tinitiate</div>
              <div className="text-xs text-[color:var(--text-muted)]">
                Minimal LMS • Markdown-first learning
              </div>
            </div>
          </div>

          {/* <button className="btn-ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <FaSun /> : <FaMoon />}
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button> */}
                  <button className="btn btn-outline" onClick={toggleTheme} type="button" aria-label="Toggle theme">
          <span style={{ fontSize: 14 }}>{theme === "dark" ? <FaSun /> : <FaMoon />}</span>
        </button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl mt-8 sm:mt-12">
        <div className="glass rounded-3xl p-6 sm:p-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Learn faster with clean, focused content.
            </h1>
            <p className="mt-4 text-[color:var(--text-muted)] text-base sm:text-lg leading-relaxed">
              Browse subjects → pick a topic → read beautifully rendered markdown with code highlighting,
              images, and offline caching support.
            </p>

<div className="mt-6 flex flex-col sm:flex-row gap-3">
  <button
    className="btn btn-primary w-full sm:w-auto"
    onClick={() => router.push("/dashboard")}
    type="button"
  >
    <span style={{ whiteSpace: "nowrap" }}>Browse Tutorials</span>
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <FaArrowRight />
    </span>
  </button>

  <button
    className="btn btn-outline w-full sm:w-auto"
    onClick={() => router.push("/subject/vuejs")}
    type="button"
  >
    <span style={{ whiteSpace: "nowrap" }}>Jump to Vue.js</span>
  </button>
</div>


            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip">Markdown-first</span>
              <span className="chip">Dark mode</span>
              <span className="chip">Offline-ready</span>
              <span className="chip">Code highlighting</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl py-10 text-center text-sm text-[color:var(--text-muted)]">
        © TINITIATE.COM
      </footer>
    </div>
  );
}
