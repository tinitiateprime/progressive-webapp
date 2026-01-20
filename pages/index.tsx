"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SignInButton from "../components/SignInButton";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const didCallBackend = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  // Helper: get user location as a promise
  const getLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("Geolocation not supported.");
        return resolve(null);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          resolve(null); // resolve null on error
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email;
    if (!email) return;

    if (didCallBackend.current) return;
    didCallBackend.current = true;

    setRedirecting(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5050";

    (async () => {
      try {
        const location = await getLocation();

        const res = await fetch(`${backendUrl}/api/auth/post-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: session.user?.name ?? "",
            email: email,
            gps: location,
          }),
        });

        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`);
        }
      } catch (e) {
        console.error("post-login failed:", e);
      } finally {
        router.push("/dashboard");
      }
    })();
  }, [status, session, router]);

  if (redirecting) return <p>Redirecting...</p>;

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

        <SignInButton />
      </header>

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
            Sign in with Google to continue and access tutorials
          </p>
          <SignInButton />
        </div>
      </main>
    </div>
  );
}
