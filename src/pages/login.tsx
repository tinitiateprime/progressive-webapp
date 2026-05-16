"use client";

import Image from "next/image";
import { useState, useContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { ThemeContext } from "../context/ThemeContext";
import {
  clearBrowserSessionActive,
  hasBrowserSessionActive,
  markBrowserSessionActive,
} from "../lib/browserSession";
import { writeCachedSessionUser } from "../lib/app-session";
import {
  cacheCurrentSessionUser,
  fetchGoogleAuthClientConfig,
  loadGoogleIdentityScript,
  requestGoogleAccessToken,
  type GoogleAuthClientConfig,
} from "../lib/google-auth-client";
import { normalizeCallbackUrl } from "../lib/public-entry";
import {
  FaMoon,
  FaSun,
  FaArrowRight,
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
    <div className="auth-field grid gap-2">
      <div className="auth-field__label-row flex items-end justify-between gap-3">
        <label className="auth-field__label text-sm font-semibold tracking-tight">{label}</label>
        {hint ? (
          <span className="auth-field__hint text-xs text-[color:var(--text-muted)]">{hint}</span>
        ) : null}
      </div>
      <div className="relative">
        <span className="auth-field__icon absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const sessionExpired =
    typeof router.query.reason === "string" && router.query.reason === "session-ended";
  const logoSrc = theme === "dark" ? "/TinitiateLogo.png" : "/TinitiateLogoLight.png";

  const callbackUrl =
    normalizeCallbackUrl(router.query.callbackUrl, "/dashboard") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleConfig, setGoogleConfig] = useState<GoogleAuthClientConfig | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && hasBrowserSessionActive()) {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    void router.prefetch(callbackUrl);
    void router.prefetch("/signup");
  }, [callbackUrl, router]);

  useEffect(() => {
    let cancelled = false;
    setGoogleReady(false);

    void fetchGoogleAuthClientConfig()
      .then((config) => {
        if (!cancelled) {
          setGoogleConfig(config);
        }

        if (!cancelled && config.enabled && !config.oauth) {
          void loadGoogleIdentityScript()
            .catch(() => undefined)
            .finally(() => {
              if (!cancelled) {
                setGoogleReady(true);
              }
            });
          return;
        }

        if (!cancelled) {
          setGoogleReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleConfig({
            enabled: false,
            clientId: "",
            oauth: false,
            tokenProviderId: "google-access-token",
          });
          setGoogleReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      // First verify with your custom API so you get custom messages:
      // - No account found. Please sign up first.
      // - Please sign in with Google.
      // - Invalid credentials.
      const verifyRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok) {
        setError(verifyData?.message || "Login failed.");
        return;
      }

      // Then create NextAuth session
      markBrowserSessionActive();
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        clearBrowserSessionActive();
        setError("Login failed. Please try again.");
        return;
      }

      writeCachedSessionUser({
        id: verifyData?.user?.id,
        name: verifyData?.user?.fullName,
        email: verifyData?.user?.email,
      });
      router.replace(result?.url || callbackUrl);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError("");

    if (!googleConfig || !googleReady) {
      return;
    }

    if (!googleConfig.enabled || !googleConfig.clientId) {
      setError(
        "Google sign-in needs a Google Client ID on this server. Add GOOGLE_CLIENT_ID, then restart or redeploy."
      );
      return;
    }

    setLoading(true);
    try {
      markBrowserSessionActive();

      if (googleConfig.oauth) {
        await signIn("google", { callbackUrl });
        return;
      }

      const accessToken = await requestGoogleAccessToken(googleConfig.clientId);
      const result = await signIn(googleConfig.tokenProviderId, {
        accessToken,
        redirect: false,
        callbackUrl,
      });

      if (result?.error || result?.ok === false) {
        clearBrowserSessionActive();
        setError("Google sign-in failed. Please try again.");
        return;
      }

      await cacheCurrentSessionUser();
      router.replace(result?.url || callbackUrl);
    } catch (err) {
      clearBrowserSessionActive();
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
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
    <div className="app-shell app-shell--home auth-shell min-h-screen relative overflow-hidden px-4 sm:px-6 flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-[color:var(--brand)] opacity-[0.10] blur-[90px]" />
        <div className="absolute -bottom-44 -left-44 h-[520px] w-[520px] rounded-full bg-[color:var(--brand-2)] opacity-[0.10] blur-[90px]" />
        <div className="auth-grid-pattern absolute inset-0 opacity-[0.07]" />
      </div>

      {/* Topbar */}
      <header className="auth-header mx-auto max-w-6xl pt-5 sm:pt-7 w-full relative">
        <div className="auth-topbar glass rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer"
            onClick={() => router.push("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/");
            }}
          >
            <Image
              src={logoSrc}
              alt="Tinitiate"
              width={1720}
              height={181}
              style={{ width: 180, maxWidth: "48vw", height: "auto", objectFit: "contain" }}
            />
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

      {/* Content */}
      <main className="auth-main mx-auto max-w-6xl mt-8 sm:mt-12 w-full flex-1 relative">
        <div className="auth-layout grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* Left marketing panel */}
          <section className="auth-panel auth-promo-panel glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[color:var(--brand)] opacity-[0.10] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[color:var(--brand-2)] opacity-[0.10] blur-3xl" />

            <div className="relative">
              <div className="auth-eyebrow inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                Futuristic
              </div>

              <h2 className="auth-panel-title mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">
                Welcome back
              </h2>

              <p className="auth-panel-copy mt-3 text-sm sm:text-base text-[color:var(--text-muted)] leading-relaxed max-w-prose">
                Sign in to access your dashboard, manage your workspace, and continue
                where you left off - with a modern, distraction-free experience.
              </p>

              <div className="mt-6 text-xs text-[color:var(--text-muted)]">
                New here? Create your account first.
              </div>

              <button
                className="mt-3 btn btn-outline !rounded-2xl w-full sm:w-auto"
                type="button"
                onClick={() => router.push("/signup")}
              >
                New user? Sign up
              </button>
            </div>
          </section>

          {/* Right form panel */}
          <section className="auth-panel auth-form-panel glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 h-[120px] opacity-[0.55]"
              style={{
                background:
                  "linear-gradient(to bottom, color-mix(in srgb, var(--surface) 14%, transparent), transparent)",
              }}
            />

            <div className="max-w-xl relative">
              <div className="auth-eyebrow inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                Existing users login
              </div>

              <h1 className="auth-form-title mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">
                Sign in
              </h1>
              <p className="auth-form-copy mt-2 text-sm text-[color:var(--text-muted)]">
                Continue with Google or use email/password.
              </p>

              {sessionExpired ? (
                <div
                  className="mt-4 rounded-2xl border border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--text)]"
                  style={{
                    background:
                      "color-mix(in srgb, var(--dashboard-avatar-bg) 16%, transparent)",
                  }}
                >
                  Your last browser session ended. Please sign in again.
                </div>
              ) : null}

              <div className="auth-provider-actions mt-6 grid gap-3">
                <button
                  className="auth-btn btn btn-outline w-full !rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  onClick={onGoogle}
                  disabled={loading || !googleReady}
                >
                  <span className="inline-flex items-center gap-2">
                    <FaGoogle />
                    {googleReady ? "Continue with Google" : "Checking Google..."}
                  </span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[color:var(--border)]" />
                  <div className="text-xs text-[color:var(--text-muted)]">OR</div>
                  <div className="h-px flex-1 bg-[color:var(--border)]" />
                </div>
              </div>

              <form onSubmit={onSubmit} className="auth-form mt-6 grid gap-4">
                <Field label="Email" icon={<FaAt />} hint="Use your registered email">
                  <input
                    className="auth-input w-full rounded-2xl border border-[color:var(--border)] bg-transparent pl-10 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[color:var(--brand)] transition"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    type="email"
                  />
                </Field>

                <Field label="Password" icon={<FaLock />} hint="Keep it private">
                  <div className="relative">
                    <input
                      className="auth-input w-full rounded-2xl border border-[color:var(--border)] bg-transparent pl-10 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[color:var(--brand)] transition"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="auth-password-toggle absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] hover:opacity-80 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>

                {error ? (
                  <div
                    aria-live="polite"
                    className="text-sm rounded-2xl border border-[color:var(--border)] px-4 py-3"
                    style={{
                      color: "var(--status-offline-color)",
                      background:
                        "color-mix(in srgb, var(--status-offline-color) 7%, transparent)",
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  className="auth-btn btn btn-primary w-full !rounded-2xl group disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "Signing in..." : "Login"}</span>
                  <span className="inline-flex items-center transition-transform group-hover:translate-x-0.5">
                    <FaArrowRight />
                  </span>
                </button>

                <button
                  className="auth-btn btn btn-outline w-full !rounded-2xl"
                  type="button"
                  onClick={() => router.push("/signup")}
                  disabled={loading}
                >
                  New user? Sign up first
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer mx-auto max-w-6xl w-full py-8 sm:py-10 relative">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[color:var(--text-muted)]">
            <span>Copyright {new Date().getFullYear()} TINITIATE Technologies Pvt Ltd.</span>
            <span className="opacity-80">tinitiate.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { redirectAuthenticatedUserFromPublicPage as getServerSideProps } from "../lib/redirect-authenticated-page";
