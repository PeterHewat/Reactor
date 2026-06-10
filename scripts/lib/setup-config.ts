import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GitHubRepo } from "./repo-identity";

/** GitHub secret sync steps performed by setup (`gh secret set`). */
export type GitHubSyncedSecrets = {
  /** Repository secrets for PR CI and E2E (dev Convex + Clerk). */
  repo?: boolean;
  /** GitHub `production` environment secrets for `release-*` tags. */
  production?: boolean;
  /** Repository secrets for Vercel deploy workflows (`VERCEL_TOKEN`, project IDs). */
  vercel?: boolean;
};

export type VercelSetupMeta = {
  /** Vercel projects, env vars, and domains configured via setup. */
  synced?: boolean;
  /** User confirmed Vercel DNS nameservers at registrar (setup pauses until true). */
  dnsConfigured?: boolean;
  orgId: string;
  projectIdWeb: string;
  projectIdMarketing: string;
  projectNameWeb: string;
  projectNameMarketing: string;
};

export type SetupConfig = {
  productName: string;
  productTagLine: string;
  /** Omit until you own a domain — re-run setup to attach custom hostnames. */
  apexDomain?: string;
  github: {
    org: string;
    repo: string;
    syncedSecrets?: GitHubSyncedSecrets;
  } | null;
  /** When true, setup replaces MIT `LICENSE` with the proprietary stub. */
  removeMitLicense?: boolean;
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
    if (!parsed.productName) {
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
 * @param productTagLine - Marketing tagline
 * @param apexDomain - Apex domain, when configured
 * @param github - Parsed GitHub remote, if any
 */
export function buildSetupConfig(
  productName: string,
  productTagLine: string,
  apexDomain: string | undefined,
  github: GitHubRepo | null,
  existing?: SetupConfig | null,
  removeMitLicense?: boolean,
): SetupConfig {
  return {
    productName,
    productTagLine,
    ...(apexDomain ? { apexDomain } : {}),
    github: github
      ? {
          org: github.org,
          repo: github.repo,
          syncedSecrets: existing?.github?.syncedSecrets,
        }
      : null,
    removeMitLicense,
    vercel: existing?.vercel,
  };
}

/**
 * Marks one GitHub secret sync step as completed in setup config.
 *
 * @param root - Repository root
 * @param key - Which sync step completed
 */
function markGitHubSecretSynced(root: string, key: keyof GitHubSyncedSecrets): void {
  const config = readSetupConfig(root);
  if (!config?.github) {
    return;
  }
  writeSetupConfig(root, {
    ...config,
    github: {
      ...config.github,
      syncedSecrets: { ...config.github.syncedSecrets, [key]: true },
    },
  });
}

/**
 * Records that dev GitHub repository secrets were synced by setup.
 *
 * @param root - Repository root
 */
export function markGithubSecretsSynced(root: string): void {
  markGitHubSecretSynced(root, "repo");
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
  writeSetupConfig(root, {
    ...config,
    vercel: { ...config.vercel, ...vercel, synced: true },
  });
}

/**
 * Records that the user confirmed registrar DNS for Vercel hostnames.
 *
 * @param root - Repository root
 */
export function markVercelDnsConfigured(root: string): void {
  const config = readSetupConfig(root);
  if (!config?.vercel) {
    return;
  }
  writeSetupConfig(root, {
    ...config,
    vercel: { ...config.vercel, dnsConfigured: true },
  });
}

/**
 * Records that Vercel deploy secrets were synced to GitHub repository secrets.
 *
 * @param root - Repository root
 */
export function markVercelGithubSecretsSynced(root: string): void {
  markGitHubSecretSynced(root, "vercel");
}

/**
 * Records that production GitHub environment secrets were synced by setup.
 *
 * @param root - Repository root
 */
export function markProductionGithubSecretsSynced(root: string): void {
  markGitHubSecretSynced(root, "production");
}
