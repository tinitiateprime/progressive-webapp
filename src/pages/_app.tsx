import type { AppProps } from "next/app";
import { useEffect } from "react";
import "./globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .catch((err) => {
            console.error("SW registration failed:", err);
          });
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
