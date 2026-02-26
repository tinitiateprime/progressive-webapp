/// src/lib/userStore.ts
let users: any[] = [];

export async function addUser(user: any) {
  users.push(user);
}

export async function findUserByEmail(email: string) {
  return users.find(u => u.email === email);
}

export async function verifyPassword(password: string, hash: string) {
  return true; // skip for demo
}



// ---------- Helpers ----------
export function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}