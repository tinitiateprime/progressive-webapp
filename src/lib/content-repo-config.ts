export const CONTENT_REPO_OWNER =
  process.env.NEXT_PUBLIC_CONTENT_REPO_OWNER ||
  process.env.CONTENT_REPO_OWNER ||
  "tinitiateprime";

export const CONTENT_REPO_NAME =
  process.env.NEXT_PUBLIC_CONTENT_REPO_NAME ||
  process.env.CONTENT_REPO_NAME ||
  "tinitiate_it_traning_app";

export const CONTENT_REPO_BRANCH =
  process.env.NEXT_PUBLIC_CONTENT_REPO_BRANCH ||
  process.env.CONTENT_REPO_BRANCH ||
  "main";

export const buildContentRepoRawUrl = (filePath: string) =>
  `https://raw.githubusercontent.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}/${CONTENT_REPO_BRANCH}/${filePath}`;

export const buildContentRepoBlobUrl = (filePath: string) =>
  `https://github.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}/blob/${CONTENT_REPO_BRANCH}/${filePath}`;
