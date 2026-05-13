export const buildPublicEntryUrl = (callbackUrl?: string, reason?: string) => {
  const params = new URLSearchParams();
  const nextPath = String(callbackUrl || "").trim();
  const nextReason = String(reason || "").trim();

  if (nextPath) {
    params.set("callbackUrl", nextPath);
  }

  if (nextReason) {
    params.set("reason", nextReason);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
};
