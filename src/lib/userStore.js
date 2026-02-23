import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const FILE_PATH = path.join(process.cwd(), "public", "user.json");

async function ensureFile() {
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify({ users: [] }, null, 2), "utf-8");
  }
}

export async function readDb() {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, "utf-8");
  try {
    const db = JSON.parse(raw || "{}");
    if (!db.users) db.users = [];
    return db;
  } catch {
    return { users: [] };
  }
}

export async function writeDb(db) {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(String(password), salt, 64).toString("hex");

  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(verify, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function findUserByEmail(email) {
  const db = await readDb();
  const e = normalizeEmail(email);
  return (db.users || []).find((u) => u.email === e) || null;
}

export async function addUser({ fullName, email, password }) {
  const db = await readDb();
  const e = normalizeEmail(email);

  const existing = (db.users || []).find((u) => u.email === e);
  if (existing) {
    return { ok: false, status: 409, message: "Account already exists. Please login." };
  }

  const user = {
    id: crypto.randomUUID(),
    fullName: String(fullName || "").trim(),
    email: e,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  db.users = [...(db.users || []), user];
  await writeDb(db);

  return { ok: true, user };
}