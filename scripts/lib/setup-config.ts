import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GitHubRepo } from "./repo-identity";

export type VercelSetupMeta = {
  orgId: string;
  webProjectId: string;
  marketingProjectId: string;
  webProjectName: string;
  marketingProjectName: string;
};

export type SetupConfig = {
  productName: string;
  apexDomain: string;
  github: { org: string; repo: string } | null;
  /** When true, setup replaces MIT `LICENSE` with the proprietary stub. */
  removeMitLicense?: boolean;
  /** Set after dev repository secrets were pushed via setup + `gh`. */
  githubSecretsSynced?: boolean;
  /** Set after Vercel projects/domains were configured via setup. */
  vercelSynced?: boolean;
  /** Set after VERCEL_* repository secrets were pushed via setup + `gh`. */
  vercelGithubSecretsSynced?: boolean;
  /** Set after production environment secrets were pushed via setup + `gh`. */
  productionGithubSecretsSynced?: boolean;
  vercel?: VercelSetupMeta;
};

const REL_PATH = ".reactor/setup.json";

/**
 * Absolute path to `.reactor/setup.json`.
 *
 * @param root - Repository root
 */
export function setupConfigPath(root: string): string {
  return resolve(root, REL_PATH);
}

/**
 * Reads `.reactor/setup.json` when present.
 *
 * @param root - Repository root
 */
export function readSetupConfig(root: string): SetupConfig | null {
  const path = setupConfigPath(root);
  if (!existsSync(path)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as SetupConfig;
    if (!parsed.productName || !parsed.apexDomain) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Writes `.reactor/setup.json`.
 *
 * @param root - Repository root
 * @param config - Setup config to persist
 */
export function writeSetupConfig(root: string, config: SetupConfig): void {
  const path = setupConfigPath(root);
  mkdirSync(resolve(root, ".reactor"), { recursive: true });
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Builds a new setup config object.
 *
 * @param productName - Display product name
 * @param apexDomain - Apex domain
 * @param github - Parsed GitHub remote, if any
 */
export function buildSetupConfig(
  productName: string,
  apexDomain: string,
  github: GitHubRepo | null,
  existing?: SetupConfig | null,
  removeMitLicense?: boolean,
): SetupConfig {
  return {
    productName,
    apexDomain,
    github: github ? { org: github.org, repo: github.repo } : null,
    removeMitLicense,
    githubSecretsSynced: existing?.githubSecretsSynced,
    vercelSynced: existing?.vercelSynced,
    vercelGithubSecretsSynced: existing?.vercelGithubSecretsSynced,
    productionGithubSecretsSynced: existing?.productionGithubSecretsSynced,
    vercel: existing?.vercel,
  };
}

/**
 * Records that dev GitHub repository secrets were synced by setup.
 *
 * @param root - Repository root
 */
export function markGithubSecretsSynced(root: string): void {
  const config = readSetupConfig(root);
  if (!config) {
    return;
  }
  writeSetupConfig(root, { ...config, githubSecretsSynced: true });
}

/**
 * Records Vercel project metadata after a successful bootstrap.
 *
 * @param root - Repository root
 * @param vercel - Vercel project IDs and org
 */
export function markVercelSynced(root: string, vercel: VercelSetupMeta): void {
  const config = readSetupConfig(root);
  if (!config) {
    return;
  }
  writeSetupConfig(root, { ...config, vercelSynced: true, vercel });
}

/**
 * Records that Vercel deploy secrets were synced to GitHub.
 *
 * @param root - Repository root
 */
export function markVercelGithubSecretsSynced(root: string): void {
  const config = readSetupConfig(root);
  if (!config) {
    return;
  }
  writeSetupConfig(root, { ...config, vercelGithubSecretsSynced: true });
}

/**
 * Records that production GitHub environment secrets were synced by setup.
 *
 * @param root - Repository root
 */
export function markProductionGithubSecretsSynced(root: string): void {
  const config = readSetupConfig(root);
  if (!config) {
    return;
  }
  writeSetupConfig(root, { ...config, productionGithubSecretsSynced: true });
}
