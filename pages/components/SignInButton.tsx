"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        onClick={() =>
          signOut({
            callbackUrl: "/",
          })
        }
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "20px",
          border: "none",
          backgroundColor: "#db4437",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "20px",
        border: "none",
        backgroundColor: "#4285f4",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      Sign in with Google
    </button>
  );
}


