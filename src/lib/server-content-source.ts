import {
  buildContentRepoRawUrl,
  getContentRepoPathCandidates,
  getContentRepoNameCandidates,
} from "./content-repo-config";

export type RepoContentSource = {
  repoName: string;
  text: string;
  url: string;
};

export async function readRepoContentSource(
  repoFilePath: string,
  preferredRepoName?: string
): Promise<RepoContentSource> {
  const pathCandidates = getContentRepoPathCandidates(repoFilePath);
  const repoNameCandidates = getContentRepoNameCandidates(preferredRepoName);
  let lastStatus: number | null = null;

  for (const repoName of repoNameCandidates) {
    for (const pathCandidate of pathCandidates) {
      const remoteUrl = buildContentRepoRawUrl(pathCandidate, repoName);
      const response = await fetch(remoteUrl, {
        cache: "no-store",
        headers: {
          "User-Agent": "Tinitiate-Edu-App",
        },
      });

      if (response.ok) {
        return {
          repoName,
          text: await response.text(),
          url: remoteUrl,
        };
      }

      lastStatus = response.status;
    }
  }

  throw new Error(
    `Failed to fetch ${repoFilePath} from GitHub${lastStatus ? ` (${lastStatus})` : ""}`
  );
}

export async function readRepoContentText(repoFilePath: string, preferredRepoName?: string) {
  const source = await readRepoContentSource(repoFilePath, preferredRepoName);
  return source.text;
}
