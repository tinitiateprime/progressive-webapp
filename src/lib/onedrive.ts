// File: src/lib/onedrive.ts

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export type OneDriveJsonResult<T = unknown> = {
  fileName: string;
  exists: boolean;
  data: T | null;
  item?: any;
};

function safeUserKey(email: string) {
  return String(email || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "user";
}

function safeLogicalName(name: string) {
  const cleaned = String(name || "data")
    .trim()
    .toLowerCase()
    .replace(/\.json$/i, "")
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned || "data";
}

export function buildUserJsonFileName(email: string, logicalName: string) {
  const user = safeUserKey(email);
  const file = safeLogicalName(logicalName);
  return `${file}__${user}.json`;
}

function encodePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((p) => encodeURIComponent(p))
    .join("/");
}

async function graphFetch(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  return res;
}

export async function ensureAppRoot(accessToken: string) {
  const res = await graphFetch(accessToken, "/me/drive/special/approot");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OneDrive approot failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function readJsonFromAppFolder<T = unknown>(
  accessToken: string,
  fileName: string
): Promise<OneDriveJsonResult<T>> {
  await ensureAppRoot(accessToken);

  const encoded = encodePath(fileName);

  const metaRes = await graphFetch(
    accessToken,
    `/me/drive/special/approot:/${encoded}`
  );

  if (metaRes.status === 404) {
    return {
      fileName,
      exists: false,
      data: null,
    };
  }

  if (!metaRes.ok) {
    const text = await metaRes.text().catch(() => "");
    throw new Error(`Read metadata failed (${metaRes.status}): ${text}`);
  }

  const item = await metaRes.json();

  const contentRes = await graphFetch(
    accessToken,
    `/me/drive/special/approot:/${encoded}:/content`
  );

  if (!contentRes.ok) {
    const text = await contentRes.text().catch(() => "");
    throw new Error(`Read content failed (${contentRes.status}): ${text}`);
  }

  const raw = await contentRes.text();
  let data: T | null = null;

  if (raw.trim()) {
    data = JSON.parse(raw) as T;
  }

  return {
    fileName,
    exists: true,
    data,
    item,
  };
}

export async function writeJsonToAppFolder<T = unknown>(
  accessToken: string,
  fileName: string,
  data: T
): Promise<OneDriveJsonResult<T>> {
  await ensureAppRoot(accessToken);

  const encoded = encodePath(fileName);
  const body = JSON.stringify(data, null, 2);

  const putRes = await graphFetch(
    accessToken,
    `/me/drive/special/approot:/${encoded}:/content`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body,
    }
  );

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    throw new Error(`Write failed (${putRes.status}): ${text}`);
  }

  const item = await putRes.json();

  return {
    fileName,
    exists: true,
    data,
    item,
  };
}