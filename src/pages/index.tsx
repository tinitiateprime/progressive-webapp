"use client";

import { useRouter } from "next/router";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import {
  FaMoon,
  FaSun,
  FaArrowRight,
  FaBook,
  FaCode,
  FaBolt,
} from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="min-h-screen px-4 sm:px-6">
      {/* ================= HEADER ================= */}
      <header className="mx-auto max-w-7xl pt-6">
        <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon_new.png"
              alt="Tinitiate"
              className="h-10 w-10 rounded-xl"
            />
            <div>
              <div className="text-base font-semibold">Tinitiate</div>
              <div className="text-xs text-[color:var(--text-muted)]">
                Learn once. Remember forever.
              </div>
            </div>
          </div>

          <button
            className="btn-ghost gap-2"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <main className="mx-auto max-w-7xl mt-10 sm:mt-16">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* -------- LEFT CONTENT -------- */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Learn Smarter.
              <span className="block text-primary">Code Faster.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg text-[color:var(--text-muted)] leading-relaxed">
              Tinitiate empowers developers with clean, readable tutorials and
              interactive code examples, all in a distraction-free, responsive
              layout.
            </p>

            {/* ===== CTAs ===== */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                className="btn btn-primary gap-2 w-full sm:w-auto"
                onClick={() => router.push("/dashboard")}
              >
                Start Learning <FaArrowRight />
              </button>

              <button
                className="btn btn-outline gap-2 w-full sm:w-auto"
                onClick={() => router.push("/subjects")}
              >
                <FaBook className="text-sm" />
                Browse Subjects
              </button>
            </div>

            {/* ===== FEATURES ===== */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass rounded-xl p-3 text-center shadow hover:scale-105 transition">
                <FaBook className="mx-auto text-indigo-500 text-xl mb-1" />
                <div className="text-sm font-semibold">Tutorials</div>
              </div>

              <div className="glass rounded-xl p-3 text-center shadow hover:scale-105 transition">
                <FaCode className="mx-auto text-purple-500 text-xl mb-1" />
                <div className="text-sm font-semibold">Code Examples</div>
              </div>

              <div className="glass rounded-xl p-3 text-center shadow hover:scale-105 transition">
                <FaBolt className="mx-auto text-pink-500 text-xl mb-1" />
                <div className="text-sm font-semibold">Fast Learning</div>
              </div>

              <div className="glass rounded-xl p-3 text-center shadow hover:scale-105 transition">
                <FaMoon className="mx-auto text-yellow-500 text-xl mb-1" />
                <div className="text-sm font-semibold">Dark Mode</div>
              </div>
            </div>
          </div>

          {/* -------- RIGHT VISUAL -------- */}
          <div className="relative">
            <div className="glass rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="space-y-4">
                <div className="h-4 w-3/4 rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-5/6 rounded bg-black/10 dark:bg-white/10" />

                <div className="mt-6 rounded-xl bg-black/80 dark:bg-white/10 text-white dark:text-black p-4 text-sm font-mono">
                  <div className="text-green-400">// markdown example</div>
                  <div>const learn = "fast";</div>
                  <div>console.log(learn);</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mx-auto max-w-7xl py-12 text-center text-sm text-[color:var(--text-muted)]">
        © {new Date().getFullYear()} TINITIATE.COM
      </footer>
    </div>
  );
}
