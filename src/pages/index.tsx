"use client";

import { useRouter } from "next/navigation";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import {
  FaMoon,
  FaSun,
  FaArrowRight,
  FaLinkedinIn,
  FaYoutube,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="min-h-screen px-4 sm:px-6 flex flex-col">
      {/* Topbar */}
      <header className="mx-auto max-w-6xl pt-5 sm:pt-7 w-full">
        <div className="glass rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/favicon_new.png"
              alt="Tinitiate"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl shrink-0"
            />
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">Tinitiate</div>
              <div className="text-xs text-[color:var(--text-muted)] truncate">
                Minimal LMS • Markdown-first learning
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
          >
            <span className="text-[14px]">{theme === "dark" ? <FaSun /> : <FaMoon />}</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl mt-8 sm:mt-12 w-full flex-1">
        <div className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          {/* subtle background accent */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[color:var(--brand)] opacity-[0.10] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[color:var(--brand-2)] opacity-[0.10] blur-3xl" />

          <div className="max-w-2xl relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
              Offline-ready • Fast navigation • Clean UI
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight">
              Learn faster with clean, focused content.
            </h1>

            <p className="mt-4 text-[color:var(--text-muted)] text-base sm:text-lg leading-relaxed">
              Browse subjects → pick a topic → read beautifully rendered markdown
              with code highlighting, images, and offline caching support.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              {/* ✅ Changed from /dashboard to /signup */}
              <button
                className="btn btn-primary w-full sm:w-auto"
                onClick={() => router.push("/signup")}
                type="button"
              >
                <span className="whitespace-nowrap">Browse Tutorials</span>
                <span className="inline-flex items-center">
                  <FaArrowRight />
                </span>
              </button>

              <button
                className="btn btn-outline w-full sm:w-auto"
                onClick={() => router.push("/subject/vuejs")}
                type="button"
              >
                <span className="whitespace-nowrap">Jump to Vue.js</span>
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="chip">Markdown-first</span>
              <span className="chip">Dark mode</span>
              <span className="chip">Offline-ready</span>
              <span className="chip">Code highlighting</span>
              <span className="chip">Mobile-friendly</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (responsive, modern, moderate UI) */}
      <footer className="mx-auto max-w-6xl w-full py-8 sm:py-10">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left */}
            <div className="lg:col-span-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src="/favicon_new.png"
                  alt="Tinitiate"
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    TINITIATE
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-semibold">
                    TECHNICAL INITIATE Technologies Pvt Ltd
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs sm:text-sm leading-6 text-[color:var(--text-muted)]">
                TINITIATE is a leading IT consulting, development and training
                company, dedicated to empowering businesses with cutting-edge
                technology solutions and high-quality professional training.
                We deliver tailored solutions to meet the evolving demands of
                enterprises worldwide.
              </p>

              <div className="mt-6 text-[11px] sm:text-xs font-bold tracking-widest text-[color:var(--text-muted)]">
                FOLLOW US
              </div>

              <div className="mt-3 flex items-center gap-3 text-[color:var(--text-muted)]">
                {[
                  {
                    href: "https://www.linkedin.com/company/tinitiate/",
                    label: "LinkedIn",
                    icon: <FaLinkedinIn />,
                  },
                  {
                    href: "https://www.youtube.com/",
                    label: "YouTube",
                    icon: <FaYoutube />,
                  },
                  {
                    href: "https://twitter.com/",
                    label: "X / Twitter",
                    icon: <FaTwitter />,
                  },
                  {
                    href: "https://www.facebook.com/",
                    label: "Facebook",
                    icon: <FaFacebookF />,
                  },
                  {
                    href: "https://www.instagram.com/",
                    label: "Instagram",
                    icon: <FaInstagram />,
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] hover:opacity-80 transition"
                    title={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="lg:col-span-3">
              <div className="text-base sm:text-lg font-bold">Company</div>
              <div className="mt-3 sm:mt-4 grid gap-2.5 text-xs sm:text-sm">
                <a
                  className="hover:underline"
                  href="https://tinitiate.com/about"
                  target="_blank"
                  rel="noreferrer"
                >
                  About Us
                </a>
                <a
                  className="hover:underline"
                  href="https://tinitiate.com/pricing-policy"
                  target="_blank"
                  rel="noreferrer"
                >
                  Pricing Policy
                </a>
                <a
                  className="hover:underline"
                  href="https://tinitiate.com/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy Policy
                </a>
                <a
                  className="hover:underline"
                  href="https://tinitiate.com/refund-policy"
                  target="_blank"
                  rel="noreferrer"
                >
                  Refund Policy
                </a>
                <a
                  className="hover:underline"
                  href="https://tinitiate.com/terms-and-conditions"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms &amp; Conditions
                </a>
              </div>
            </div>

            {/* Contact */}
            <div className="lg:col-span-4">
              <div className="text-base sm:text-lg font-bold">Contact Us</div>

              <div className="mt-3 sm:mt-4 grid gap-4 text-xs sm:text-sm text-[color:var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <FaEnvelope className="shrink-0" />
                  <a
                    className="hover:underline break-all"
                    href="mailto:contact@tinitiate.com"
                  >
                    contact@tinitiate.com
                  </a>
                </div>

                <div>
                  <div className="font-semibold text-[color:var(--text)]">
                    USA:
                  </div>
                  <div className="break-words">
                    +1 (973) 653-6870, +1 (206) 802-4102
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-[color:var(--text)]">
                    India:
                  </div>
                  <div>+91 95534 95553</div>
                </div>

                <div>
                  <div className="font-semibold text-[color:var(--text)]">
                    Head Office:
                  </div>
                  <div className="break-words">
                    Plot No. B 503, Ace Ajanta, Beside Indu Aranya, Nagole,
                    Hayathnagar, R.R. – 500068, Telangana, India
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-[color:var(--text)]">
                    Corporate Office:
                  </div>
                  <div className="break-words">
                    1-2/10 Sbh Colony Mohan Nagar, SBH Colony, Kothapet, 500036,
                    Telangana, India
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 border-t border-[color:var(--border)] pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
            <span>
              © {new Date().getFullYear()} TINITIATE Technologies Pvt Ltd. All
              rights reserved.
            </span>
            <span className="opacity-80">tinitiate.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}