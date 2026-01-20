"use client";
import { useSession } from "next-auth/react";

export default function Userinfo() {
  const { data: session } = useSession();

  if (!session) return <p style={{ color: "#777" }}>You are not signed in.</p>;

  return (
    <div>
      <img
        src={session.user?.image!}
        alt="User Avatar"
        style={{ width: "60px", borderRadius: "50%", marginBottom: "10px" }}
      />
      <p style={{ fontWeight: "bold", fontSize: "18px" }}>
        {session.user?.name}
      </p>
      <p style={{ color: "#555" }}>{session.user?.email}</p>
    </div>
  );
}
