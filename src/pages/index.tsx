"use client";

// We keep "use client" only if you plan to add simple UI interactions later,
// otherwise, for a truly static Next.js page, you could even remove this.
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Header Section */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/favicon_new.png"
            alt="Tinitiate Logo"
            style={{ height: 40, marginRight: 10 }}
          />
          <span style={{ fontSize: 20, fontWeight: 500, color: "#202124" }}>
            Tinitiate
          </span>
        </div>
        
        {/* Static Placeholder for Navigation or Action */}
        <button style={buttonStyle}>Get Started</button>
      </header>

      {/* Main Hero Section */}
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 500 }}>
          <h1
            style={{
              fontSize: "36px",
              color: "#202124",
              marginBottom: "20px",
              fontWeight: 500,
            }}
          >
            Welcome to Tinitiate
          </h1>
          <p style={{ fontSize: "16px", color: "#5f6368", marginBottom: 30 }}>
            Explore our comprehensive tutorials and technical guides.
          </p>
          <button style={{ ...buttonStyle, padding: "12px 24px", fontSize: "16px" }} onClick={() => router.push('/dashboard')}>
            Browse Tutorials
          </button>
        </div>
      </main>
    </div>
  );
}

// Simple reusable style object
const buttonStyle = {
  backgroundColor: "#1a73e8",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 500,
};