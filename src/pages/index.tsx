"use client";

import { useRouter } from "next/router";
import { useContext } from "react";
import { useSession } from "next-auth/react";
import { ThemeContext } from "../context/ThemeContext";
import {
  FaMoon,
  FaSun,
  FaArrowRight,
  FaLinkedinIn,
  FaYoutube,
  FaFacebookF,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const primaryHref = status === "authenticated" ? "/dashboard" : "/signup";
  const logoSrc = theme === "dark" ? "/TinitiateLogo.png" : "/TinitiateLogoLight.png";

  return (
    <div className="min-h-screen px-4 sm:px-6 flex flex-col">
      <header className="mx-auto max-w-6xl pt-5 sm:pt-7 w-full">
        <div className="glass rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center">
            <img
              src={logoSrc}
              alt="Tinitiate"
              className="block w-[220px] sm:w-[270px] h-auto shrink-0 self-center object-contain translate-y-[1px] sm:translate-y-[2px]"
            />
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

      <main className="mx-auto max-w-6xl mt-8 sm:mt-12 w-full flex-1">
        <div className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[color:var(--brand)] opacity-[0.10] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[color:var(--brand-2)] opacity-[0.10] blur-3xl" />

          <div className="max-w-2xl relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
              Offline-ready &bull; Favorites &bull; Clean UI
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight">
              Learn faster with clean, focused content.
            </h1>

            <p className="mt-4 text-[color:var(--text-muted)] text-base sm:text-lg leading-relaxed">
              Browse subjects, save what matters, and come back to your learning flow
              with favorites plus offline-ready reading.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                className="btn btn-primary w-full sm:w-auto"
                onClick={() => router.push(primaryHref)}
                type="button"
              >
                <span className="whitespace-nowrap">
                  {status === "authenticated" ? "Open Dashboard" : "Browse Tutorials"}
                </span>
                <span className="inline-flex items-center">
                  <FaArrowRight />
                </span>
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="chip">Dark mode</span>
              <span className="chip">Offline-ready</span>
              <span className="chip">Favorites</span>
              <span className="chip">Mobile-friendly</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl w-full py-8 sm:py-10">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <img
                src={logoSrc}
                alt="Tinitiate"
                className="block w-[200px] sm:w-[240px] h-auto object-contain"
              />

              <div className="mt-2 text-xs sm:text-sm font-semibold">
                Tinitiate AI Solutions
              </div>

              <p className="mt-4 text-xs sm:text-sm leading-6 text-[color:var(--text-muted)]">
                Tinitiate AI Solutions empowers learners with industry-relevant skills through hands-on training and real-time project experience. Specializing in AI, Data Engineering, and Cloud technologies, we focus on transforming knowledge into practical expertise. Our mission is to create job-ready professionals by providing real-world exposure, mentorship, and structured learning aligned with current industry demands.
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
                    href: "https://www.youtube.com/channel/UCXVm8lbVkHOxEJ4XzggTeJw",
                    label: "YouTube",
                    icon: <FaYoutube />,
                  },
                  {
                    href: "https://x.com/TinitiateAI",
                    label: "X / Twitter",
                    icon: <FaXTwitter />,
                  },
                  {
                    href: "https://www.facebook.com/profile.php?id=61589182754060",
                    label: "Facebook",
                    icon: <FaFacebookF />,
                  },
                  {
                    href: "https://www.instagram.com/tinitiate.ai/",
                    label: "Instagram",
                    icon: <FaInstagram />,
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] transition hover:opacity-80"
                    title={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

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

            <div className="lg:col-span-4">
              <div className="text-base sm:text-lg font-bold">Contact Us</div>

              <div className="mt-3 sm:mt-4 grid gap-4 text-xs sm:text-sm text-[color:var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <FaEnvelope className="shrink-0" />
                  <a
                    className="hover:underline break-all"
                    href="mailto:contact@tinitiate.com"
                  >
                    contact@tinitiateai.com
                  </a>
                </div>

                <div>
                  <div className="font-semibold text-[color:var(--text)]">USA:</div>
                  <div className="break-words">+1 (973) 653-6870, +1 (206) 802-4102</div>
                </div>

                <div>
                  <div className="font-semibold text-[color:var(--text)]">India:</div>
                  <div>+91 9848092083</div>
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

          <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--border)] pt-5 text-[11px] text-[color:var(--text-muted)] sm:flex-row sm:text-xs">
            <span>
              &copy; {new Date().getFullYear()} Tinitiate AI Solutions. All rights reserved.
              rights reserved.
            </span>
            <span className="opacity-80">tinitiateai.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
