import {
  normalizeRepoDefaultBranch,
  normalizeRepoUrl,
  REPO_SETUP_DOC_PATH,
  repoBlobUrl,
  repoSetupGuideUrl as sharedRepoSetupGuideUrl,
} from "@repo/config/repo-url";
import { loadWebEnv } from "../env";

export { REPO_SETUP_DOC_PATH };

/**
 * GitHub repository URL for this project (`VITE_REPO_URL` in `apps/web/.env.local`).
 *
 * @returns Normalized repo URL, or undefined when unset or still a placeholder
 */
export function getRepoUrl(): string | undefined {
  return normalizeRepoUrl(loadWebEnv().repoUrl);
}

function defaultBranch(): string {
  return normalizeRepoDefaultBranch(import.meta.env.VITE_REPO_DEFAULT_BRANCH);
}

/**
 * Link to a file on the default branch in the configured GitHub repository.
 *
 * @param repoRelativePath - Path from repo root (e.g. `README.md`)
 * @returns GitHub blob URL, or undefined when {@link getRepoUrl} is unset
 */
export function repoBlobUrlForProject(repoRelativePath: string): string | undefined {
  const base = getRepoUrl();
  if (!base) {
    return undefined;
  }
  return repoBlobUrl(base, repoRelativePath, defaultBranch());
}

/**
 * Link to the repository README (setup hub and Resources table).
 *
 * @returns GitHub blob URL for {@link REPO_SETUP_DOC_PATH}, or undefined when repo URL is unset
 */
export function repoSetupGuideUrl(): string | undefined {
  const base = getRepoUrl();
  if (!base) {
    return undefined;
  }
  return sharedRepoSetupGuideUrl(base, defaultBranch());
}
