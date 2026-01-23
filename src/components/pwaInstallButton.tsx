"use client";
import { useEffect, useState } from "react";

let deferredPrompt: any = null;

export default function PwaInstallButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <button
      onClick={installApp}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "12px 18px",
        borderRadius: 30,
        border: "none",
        background: "#0070f3",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
      }}
    >
      Install App
    </button>
  );
}
