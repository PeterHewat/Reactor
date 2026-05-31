import { loadWebEnv } from "../env";

const PLACEHOLDER_PATTERN = /YOUR_ORG|YOUR_REPO|your-org|your-repo/i;

/** Default blob path for setup links (durable after adopters remove the onboarding runbook). */
export const REPO_SETUP_DOC_PATH = "README.md";

/**
 * GitHub repository URL for this project (`VITE_REPO_URL` in `apps/web/.env.local`).
 *
 * @returns Normalized repo URL, or undefined when unset or still a placeholder
 */
export function getRepoUrl(): string | undefined {
  const raw = loadWebEnv().repoUrl?.trim().replace(/\/$/, "");
  if (!raw || PLACEHOLDER_PATTERN.test(raw)) {
    return undefined;
  }
  return raw;
}

/**
 * Link to a file on the default branch in the configured GitHub repository.
 *
 * @param repoRelativePath - Path from repo root (e.g. `README.md`)
 * @returns GitHub blob URL, or undefined when {@link getRepoUrl} is unset
 */
export function repoBlobUrl(repoRelativePath: string): string | undefined {
  const base = getRepoUrl();
  if (!base) {
    return undefined;
  }
  const path = repoRelativePath.replace(/^\//, "");
  return `${base}/blob/main/${path}`;
}

/**
 * Link to the repository README (setup hub and Resources table).
 *
 * @returns GitHub blob URL for {@link REPO_SETUP_DOC_PATH}, or undefined when repo URL is unset
 */
export function repoSetupGuideUrl(): string | undefined {
  return repoBlobUrl(REPO_SETUP_DOC_PATH);
}
