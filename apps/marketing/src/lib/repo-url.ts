import {
  normalizeRepoDefaultBranch,
  normalizeRepoUrl,
  REPO_SETUP_DOC_PATH,
  repoSetupGuideUrl as sharedRepoSetupGuideUrl,
} from "@repo/config/repo-url";
import { loadMarketingEnv } from "../env";

export { REPO_SETUP_DOC_PATH };

/**
 * Public GitHub repository URL (`PUBLIC_REPO_URL` in `apps/marketing/.env`).
 *
 * @returns Normalized repo URL, or undefined when unset or still a placeholder
 */
export function getPublicRepoUrl(): string | undefined {
  return normalizeRepoUrl(loadMarketingEnv().repoUrl);
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
  const branch = normalizeRepoDefaultBranch(loadMarketingEnv().repoDefaultBranch);
  return sharedRepoSetupGuideUrl(base, branch);
}
