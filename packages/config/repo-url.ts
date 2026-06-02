/** Default blob path for setup links (durable after adopters remove the onboarding runbook). */
export const REPO_SETUP_DOC_PATH = "README.md";

const PLACEHOLDER_PATTERN = /YOUR_ORG|YOUR_REPO|your-org|your-repo/i;

/**
 * Normalizes a repository URL from env (trims, strips trailing slash, rejects placeholders).
 *
 * @param raw - Raw URL from env
 * @returns Normalized URL, or undefined when unset or still a placeholder
 */
export function normalizeRepoUrl(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (!trimmed || PLACEHOLDER_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Default Git branch used for GitHub blob links.
 *
 * @param raw - Branch name from env (e.g. `main`)
 * @returns Sanitized branch name
 */
export function normalizeRepoDefaultBranch(raw: string | undefined): string {
  const branch = raw?.trim() || "main";
  return branch.replace(/^\/+|\/+$/g, "") || "main";
}

/**
 * Link to a file on the default branch in a GitHub repository.
 *
 * @param repoUrl - Repository base URL
 * @param repoRelativePath - Path from repo root (e.g. `README.md`)
 * @param defaultBranch - Branch name (default `main`)
 * @returns GitHub blob URL
 */
export function repoBlobUrl(
  repoUrl: string,
  repoRelativePath: string,
  defaultBranch = "main",
): string {
  const path = repoRelativePath.replace(/^\//, "");
  const branch = normalizeRepoDefaultBranch(defaultBranch);
  return `${repoUrl}/blob/${branch}/${path}`;
}

/**
 * Link to the repository README on the default branch.
 *
 * @param repoUrl - Repository base URL
 * @param defaultBranch - Branch name (default `main`)
 * @returns GitHub blob URL for {@link REPO_SETUP_DOC_PATH}
 */
export function repoSetupGuideUrl(repoUrl: string, defaultBranch = "main"): string {
  return repoBlobUrl(repoUrl, REPO_SETUP_DOC_PATH, defaultBranch);
}
