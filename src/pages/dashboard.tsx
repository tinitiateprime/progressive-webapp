"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();


  const repos = [
    { name: "Vue.js", slug: "vuejs" },
    { name: "Next.js", slug: "nextjs" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f0f2f5",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#0070f3", fontSize: 24 }}>
          Tinitiate Dashboard
        </h1>

        <button
          onClick={() =>
            signOut({
              callbackUrl: "/",
            })
          }
          style={{
            padding: "8px 18px",
            backgroundColor: "#e53935",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Avatar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 30,
        }}
      >
        <img
          src={session?.user?.image || "/default-avatar.png"}
          alt="User Avatar"
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Tutorials */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {repos.map((repo) => (
          <div
            key={repo.slug}
            onClick={() => router.push(`/subject/${repo.slug}`)}
            style={{
              padding: 25,
              backgroundColor: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              cursor: "pointer",
            }}
          >
            <h3 style={{ margin: 0, color: "#0070f3" }}>
              {repo.name}
            </h3>
            <p style={{ fontSize: 14, color: "#5f6368" }}>
              Click to view tutorial
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
