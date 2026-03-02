// File: src/pages/api/test-onedrive.ts

import type { NextApiRequest, NextApiResponse } from "next";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function getAppAccessToken() {
  const tenantId = getEnv("AZURE_TENANT_ID");
  const clientId = getEnv("AZURE_CLIENT_ID");
  const clientSecret = getEnv("AZURE_CLIENT_SECRET");

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Token failed (${res.status}): ${text}`);
  }

  const json = JSON.parse(text);
  if (!json.access_token) throw new Error("No access token returned");

  return String(json.access_token);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userPrincipalName = getEnv("ONEDRIVE_USER_PRINCIPAL_NAME");
    const accessToken = await getAppAccessToken();

    const graphRes = await fetch(
      `${GRAPH_BASE}/users/${encodeURIComponent(userPrincipalName)}/drive`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const text = await graphRes.text();

    return res.status(graphRes.status).json({
      ok: graphRes.ok,
      status: graphRes.status,
      userPrincipalName,
      response: (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })(),
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}