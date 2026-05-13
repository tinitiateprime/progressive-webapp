import {
  CONTENT_REPO_BASE_PATH,
  CONTENT_REPO_BRANCH,
  CONTENT_REPO_OWNER,
  buildContentRepoRawUrl,
  getContentRepoDisplayName,
  getContentRepoPathCandidates,
  getContentRepoNameCandidates,
} from "./content-repo-config";
import type { ContentRepoStatus } from "./content-types";

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

export async function readContentRepoStatus(): Promise<ContentRepoStatus> {
  const [repoName] = getContentRepoNameCandidates();

  if (!repoName) {
    throw new Error("Content repo name is not configured");
  }

  const params = new URLSearchParams({
    sha: CONTENT_REPO_BRANCH,
    per_page: "1",
  });

  if (CONTENT_REPO_BASE_PATH) {
    params.set("path", CONTENT_REPO_BASE_PATH);
  }

  const statusUrl = `https://api.github.com/repos/${CONTENT_REPO_OWNER}/${repoName}/commits?${params.toString()}`;
  const response = await fetch(statusUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Tinitiate-Edu-App",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch content repo status (${response.status})`);
  }

  const commits = (await response.json()) as Array<{
    sha?: string;
    commit?: {
      author?: { date?: string | null };
      committer?: { date?: string | null };
    };
  }>;

  const latestCommit = commits[0];
  const updatedAt =
    latestCommit?.commit?.committer?.date || latestCommit?.commit?.author?.date || null;

  return {
    repoName,
    branch: CONTENT_REPO_BRANCH,
    source: getContentRepoDisplayName(),
    updatedAt,
    commitSha: latestCommit?.sha || null,
  };
}
