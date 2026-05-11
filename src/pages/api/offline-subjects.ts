import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../lib/authOptions";
import {
  getOfflineSubjects,
  removeOfflineSubjectForUser,
  upsertOfflineSubject,
} from "../../lib/offlineStore";
import type { OfflineSubjectMeta } from "../../lib/offline";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  const userKey = sessionUser?.id || sessionUser?.email || "";

  if (!userKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    return res.status(200).json(await getOfflineSubjects(userKey));
  }

  if (req.method === "POST") {
    const body = req.body as Partial<OfflineSubjectMeta>;

    if (!body?.subject || !Array.isArray(body.topics) || !Number.isFinite(Number(body.savedAt))) {
      return res
        .status(400)
        .json({ error: "subject, savedAt and topics are required for offline sync" });
    }

    const updated = await upsertOfflineSubject(userKey, {
      subject: String(body.subject).trim(),
      savedAt: Number(body.savedAt),
      topicCount: Number(body.topicCount) || body.topics.length,
      topics: body.topics,
      subject_readme_url:
        typeof body.subject_readme_url === "string" ? body.subject_readme_url : undefined,
    });

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    const subject = String(req.query.subject || "").trim();
    if (!subject) {
      return res.status(400).json({ error: "subject query param required" });
    }

    const updated = await removeOfflineSubjectForUser(userKey, subject);
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
