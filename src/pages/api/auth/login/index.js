import { findUserByEmail, normalizeEmail, verifyPassword } from "../../../../../src/lib/userStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Missing fields: email, password" });
  }

  const user = await findUserByEmail(email);

  // ✅ new users must sign up first
  if (!user) {
    return res.status(404).json({ ok: false, message: "No account found. Please sign up first." });
  }

  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ ok: false, message: "Invalid credentials." });
  }

  // ✅ existing user -> frontend redirects to dashboard
  return res.status(200).json({
    ok: true,
    user: { id: user.id, fullName: user.fullName, email: user.email },
  });
}