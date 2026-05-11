import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
  provider?: "credentials" | "google";
};

type UserStoreFile = {
  users: StoredUser[];
};

type AddUserInput = {
  fullName: string;
  email: string;
  password?: string;
};

export type AddUserResult =
  | {
      ok: true;
      status: 201;
      user: StoredUser;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
const LEGACY_SHA256_RE = /^[a-f0-9]{64}$/i;
const PASSWORD_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH = 64;

let writeQueue = Promise.resolve();

const normalizeStoredUser = (value: unknown): StoredUser | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const id = String(record.id || "").trim();
  const fullName = String(record.fullName || "").trim();
  const email = normalizeEmail(record.email);
  const createdAt = String(record.createdAt || "").trim();
  const passwordHash =
    typeof record.passwordHash === "string" && record.passwordHash.trim()
      ? record.passwordHash.trim()
      : undefined;
  const provider =
    record.provider === "credentials" || record.provider === "google"
      ? record.provider
      : passwordHash
      ? "credentials"
      : "google";

  if (!id || !fullName || !email || !createdAt) return null;

  return {
    id,
    fullName,
    email,
    passwordHash,
    createdAt,
    provider,
  };
};

async function ensureUsersFile() {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}

async function readUserStore(): Promise<UserStoreFile> {
  await ensureUsersFile();

  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as { users?: unknown[] };
    const users = Array.isArray(parsed?.users)
      ? parsed.users
          .map((entry) => normalizeStoredUser(entry))
          .filter((entry): entry is StoredUser => Boolean(entry))
      : [];

    return { users };
  } catch {
    return { users: [] };
  }
}

async function writeUserStore(store: UserStoreFile) {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

function queueWrite<T>(task: () => Promise<T>) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function hashLegacyPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${PASSWORD_PREFIX}:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;

  if (storedHash.startsWith(`${PASSWORD_PREFIX}:`)) {
    const [, salt, expectedHex] = storedHash.split(":");
    if (!salt || !expectedHex) return false;

    const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
    const expected = Buffer.from(expectedHex, "hex");

    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  }

  if (LEGACY_SHA256_RE.test(storedHash)) {
    const actual = Buffer.from(hashLegacyPassword(password), "hex");
    const expected = Buffer.from(storedHash, "hex");

    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  }

  return false;
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const store = await readUserStore();
  return store.users.find((user) => user.email === normalizedEmail) || null;
}

export async function addUser(input: AddUserInput): Promise<AddUserResult> {
  const fullName = String(input.fullName || "").trim();
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";

  if (!fullName || !email) {
    return {
      ok: false,
      status: 400,
      message: "Full name and email are required.",
    };
  }

  return queueWrite(async () => {
    const store = await readUserStore();
    const existing = store.users.find((user) => user.email === email);

    if (existing) {
      return {
        ok: false as const,
        status: 409,
        message: "An account with this email already exists.",
      };
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      fullName,
      email,
      createdAt: new Date().toISOString(),
      provider: password ? "credentials" : "google",
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    };

    store.users.push(user);
    await writeUserStore(store);

    return {
      ok: true as const,
      status: 201,
      user,
    };
  });
}

export function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}
