export const AUTH_BROWSER_SESSION_KEY = "tinitiate.auth.browser-session";

export function markBrowserSessionActive() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_BROWSER_SESSION_KEY, "1");
}

export function clearBrowserSessionActive() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_BROWSER_SESSION_KEY);
}

export function hasBrowserSessionActive() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(AUTH_BROWSER_SESSION_KEY) === "1";
}
