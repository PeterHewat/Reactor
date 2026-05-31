const PLACEHOLDER_PATTERN = /YOUR_ORG|YOUR_REPO|your-org|your-repo/i;

export const REPO_SETUP_DOC_PATH = "README.md";

/**
 * Public GitHub repository URL (`PUBLIC_REPO_URL` in `apps/marketing/.env`).
 *
 * @returns Normalized repo URL, or undefined when unset or still a placeholder
 */
export function getPublicRepoUrl(): string | undefined {
  const raw = import.meta.env.PUBLIC_REPO_URL?.trim().replace(/\/$/, "");
  if (!raw || PLACEHOLDER_PATTERN.test(raw)) {
    return undefined;
  }
  return raw;
}

/**
 * Link to the repository README on the default branch.
 *
 * @returns GitHub blob URL for {@link REPO_SETUP_DOC_PATH}, or undefined when repo URL is unset
 */
export function repoSetupGuideUrl(): string | undefined {
  const base = getPublicRepoUrl();
  if (!base) {
    return undefined;
  }
  return `${base}/blob/main/${REPO_SETUP_DOC_PATH}`;
}
