"use client";

import { useState, useContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { ThemeContext } from "../context/ThemeContext";
import {
  FaMoon,
  FaSun,
  FaArrowRight,
  FaUser,
  FaAt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
} from "react-icons/fa";

type FieldProps = {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  hint?: string;
};

function Field({ label, icon, children, hint }: FieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-semibold tracking-tight">{label}</label>
        {hint ? (
          <span className="text-xs text-[color:var(--text-muted)]">{hint}</span>
        ) : null}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function onGoogle() {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google sign-up failed.");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Signup failed.");
        return;
      }

      // Auto login after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm">Loading...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden px-4 sm:px-6 flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-[color:var(--brand)] opacity-[0.10] blur-[90px]" />
        <div className="absolute -bottom-44 -left-44 h-[520px] w-[520px] rounded-full bg-[color:var(--brand-2)] opacity-[0.10] blur-[90px]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      {/* Topbar */}
      <header className="mx-auto max-w-6xl pt-5 sm:pt-7 w-full relative">
        <div className="glass rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer"
            onClick={() => router.push("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/");
            }}
          >
            <img
              src="/favicon_new.png"
              alt="Tinitiate"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl shrink-0 ring-1 ring-[color:var(--border)]"
            />
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">Tinitiate</div>
              <div className="text-xs text-[color:var(--text-muted)] truncate">
                Create your account
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline !rounded-2xl !px-3 !py-2 hover:opacity-90 transition"
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
          >
            <span className="text-[14px]">
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl mt-8 sm:mt-12 w-full flex-1 relative">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* Left panel */}
          <section className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[color:var(--brand)] opacity-[0.10] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[color:var(--brand-2)] opacity-[0.10] blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                Quick onboarding • Modern UI
              </div>

              <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">
                Create your account
              </h2>

              <p className="mt-3 text-sm sm:text-base text-[color:var(--text-muted)] leading-relaxed max-w-prose">
                Join Tinitiate to access your workspace, tools, and dashboard.
              </p>

              <div className="mt-6 text-xs text-[color:var(--text-muted)]">
                Already have an account?
              </div>
              <button
                className="mt-3 btn btn-outline !rounded-2xl w-full sm:w-auto"
                type="button"
                onClick={() => router.push("/login")}
                disabled={loading}
              >
                Go to Login
              </button>
            </div>
          </section>

          {/* Right form panel */}
          <section className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[120px] opacity-[0.55] [background:linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent)]" />

            <div className="max-w-xl relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                New user signup
              </div>

              <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">
                Create account
              </h1>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">
                Continue with Google or fill the details below.
              </p>

              <div className="mt-6 grid gap-3">
                <button
                  className="btn btn-outline w-full !rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  onClick={onGoogle}
                  disabled={loading}
                >
                  <span className="inline-flex items-center gap-2">
                    <FaGoogle />
                    Continue with Google
                  </span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[color:var(--border)]" />
                  <div className="text-xs text-[color:var(--text-muted)]">OR</div>
                  <div className="h-px flex-1 bg-[color:var(--border)]" />
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <Field label="Full name" icon={<FaUser />} hint="Shown on your profile">
                  <input
                    className="w-full rounded-2xl border border-[color:var(--border)] bg-transparent pl-10 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[color:var(--brand)] transition"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email" icon={<FaAt />} hint="Use a valid email">
                  <input
                    className="w-full rounded-2xl border border-[color:var(--border)] bg-transparent pl-10 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[color:var(--brand)] transition"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    type="email"
                  />
                </Field>

                <Field label="Password" icon={<FaLock />} hint="Minimum 6 characters">
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-transparent pl-10 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[color:var(--brand)] transition"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      type={showPass ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] hover:opacity-80 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>

                <Field
                  label="Confirm password"
                  icon={<FaLock />}
                  hint="Must match password"
                >
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-transparent pl-10 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[color:var(--brand)] transition"
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      type={showConfirm ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] hover:opacity-80 transition"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>

                {error ? (
                  <div
                    aria-live="polite"
                    className="text-sm rounded-2xl border border-[color:var(--border)] px-4 py-3 text-red-500 bg-[rgba(255,0,0,0.04)]"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  className="btn btn-primary w-full !rounded-2xl group disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "Creating..." : "Create account"}</span>
                  <span className="inline-flex items-center transition-transform group-hover:translate-x-0.5">
                    <FaArrowRight />
                  </span>
                </button>

                <button
                  className="btn btn-outline w-full !rounded-2xl"
                  type="button"
                  onClick={() => router.push("/login")}
                  disabled={loading}
                >
                  Already have an account? Login
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl w-full py-8 sm:py-10 relative">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
            <span>© {new Date().getFullYear()} TINITIATE Technologies Pvt Ltd.</span>
            <span className="opacity-80">tinitiate.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}