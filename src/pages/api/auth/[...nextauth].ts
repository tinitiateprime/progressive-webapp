import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";

import { authOptions } from "../../../lib/authOptions";

export { authOptions };

const firstForwardedValue = (value: string | string[] | undefined) =>
  String(Array.isArray(value) ? value[0] : value || "")
    .split(",")[0]
    .trim();

const getRequestOrigin = (req: NextApiRequest) => {
  const host = firstForwardedValue(req.headers["x-forwarded-host"]) || req.headers.host || "";

  if (!host) {
    return "";
  }

  const forwardedProto = firstForwardedValue(req.headers["x-forwarded-proto"]);
  const protocol =
    forwardedProto ||
    (String(host).startsWith("localhost") || String(host).startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
};

const ensureNextAuthUrl = (req: NextApiRequest) => {
  if (process.env.NEXTAUTH_URL) {
    return;
  }

  const origin = getRequestOrigin(req);

  if (origin) {
    process.env.NEXTAUTH_URL = origin;
    return;
  }

  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  }
};

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  ensureNextAuthUrl(req);
  return NextAuth(req, res, authOptions);
}
