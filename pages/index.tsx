"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SignInButton from "./components/SignInButton";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const didCallBackend = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email;
    if (!email) return;

    // Prevent double-call in React Strict Mode (dev) / re-renders
    if (didCallBackend.current) return;
    didCallBackend.current = true;

    setRedirecting(true);

    const location = getLocation();
    
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5050";

    (async () => {
      try {
        await fetch(`${backendUrl}/api/auth/post-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: session.user?.name ?? "",
            email: email,
            gps: location,
          }),
        });
      } catch (e) {
        console.error("post-login failed:", e);
      } finally {
        router.push("/dashboard");
      }
    })();
  }, [status, session, router]);

  
function getLocation() {
  if (navigator.geolocation) {
    // Request the location
    navigator.geolocation.getCurrentPosition(showPosition, showError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
  } else {
    // Browser doesn't support geolocation
    console.log("Geolocation is not supported by this browser.");
  }
}

// Success function
function showPosition(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  // You can now send these coordinates to your server or use them directly in the web app
}

// Error function
function showError(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
      console.log("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.log("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.log("An unknown error occurred.");
      break;
  }
}


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
