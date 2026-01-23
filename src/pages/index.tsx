"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (router.query.source === "pwa") {
      console.log("Opened from PWA");
    } else {
      console.log("Opened from Browser");
    }
  }, [router.query]);

  return (
    <div style={container}>
      {/* Header */}
      <header style={header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/icon-192.png" alt="Logo" style={{ height: 40 }} />
          <span style={{ marginLeft: 10, fontSize: 20 }}>Tinitiate</span>
        </div>
        <button style={button}>Get Started</button>
      </header>

      {/* Main */}
      <main style={main}>
        <div style={{ maxWidth: 500 }}>
          <h1>Welcome to Tinitiate</h1>
          <p>Explore our tutorials and technical guides.</p>
          <button
            style={{ ...button, padding: "12px 24px" }}
            onClick={() => router.push("/dashboard")}
          >
            Browse Tutorials
          </button>
        </div>
      </main>
    </div>
  );
}

/* Styles */
const container = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column" as const,
  backgroundColor: "#f5f5f5",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px 40px",
  backgroundColor: "#fff",
};

const main = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const button = {
  backgroundColor: "#1a73e8",
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer",
};
