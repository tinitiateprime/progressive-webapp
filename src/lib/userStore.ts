// src/lib/userStore.ts
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ---------- Types ----------
export type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string; // optional for google-only users
  createdAt: string;
};

export type DbShape = {
  users: UserRecord[];
};

// ---------- File DB ----------
const FILE_PATH = path.join(process.cwd(), "data", "users.json");

async function ensureFile(): Promise<void> {
  const dir = path.dirname(FILE_PATH);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(FILE_PATH);
  } catch {
    const empty: DbShape = { users: [] };
    await fs.writeFile(FILE_PATH, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<DbShape> {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, "utf-8");
  const parsed = JSON.parse(raw || "{}") as Partial<DbShape>;

  return {
    users: Array.isArray(parsed.users) ? (parsed.users as UserRecord[]) : [],
  };
}

export async function writeDb(db: DbShape): Promise<void> {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ---------- Helpers ----------
export function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password: string): string {
  // simple sha256 hash (your existing project may already do this)
  // if you already had bcrypt, replace this with bcrypt hash/compare
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return hashPassword(password) === passwordHash;
}

// ---------- Queries ----------
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await readDb();
  const target = normalizeEmail(email);
  const user = db.users.find((u) => normalizeEmail(u.email) === target);
  return user || null;
}

// ---------- Mutations ----------
export async function addUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ ok: true; user: UserRecord } | { ok: false; status: number; message: string }> {
  const fullName = String(input.fullName || "").trim();
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");

  if (!fullName || !email || !password) {
    return { ok: false, status: 400, message: "Missing required fields." };
  }

  const db = await readDb();
  const existing = db.users.find((u) => normalizeEmail(u.email) === email);
  if (existing) {
    return { ok: false, status: 409, message: "Email already registered." };
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    fullName,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  await writeDb(db);

  return { ok: true, user };
}