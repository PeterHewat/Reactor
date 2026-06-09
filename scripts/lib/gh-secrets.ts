import type { GitHubRepo } from "./repo-identity";

/**
 * Returns whether the GitHub CLI is installed on PATH.
 */
export async function isGhInstalled(): Promise<boolean> {
  const proc = Bun.spawn(["gh", "--version"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  return (await proc.exited) === 0;
}

/**
 * Returns whether the GitHub CLI is authenticated.
 */
export async function isGhAuthenticated(): Promise<boolean> {
  const proc = Bun.spawn(["gh", "auth", "status"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  return (await proc.exited) === 0;
}

/**
 * Sets a GitHub Actions repository secret via `gh secret set`.
 *
 * @param root - Repository root
 * @param name - Secret name
 * @param value - Secret value
 */
export async function ghSecretSet(root: string, name: string, value: string): Promise<boolean> {
  const proc = Bun.spawn(["gh", "secret", "set", name, "--body", value], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) === 0;
}

/**
 * Sets a GitHub Actions environment secret via `gh secret set --env`.
 *
 * @param root - Repository root
 * @param environment - GitHub environment name (e.g. `production`)
 * @param name - Secret name
 * @param value - Secret value
 */
export async function ghSecretSetEnv(
  root: string,
  environment: string,
  name: string,
  value: string,
): Promise<boolean> {
  const proc = Bun.spawn(["gh", "secret", "set", name, "--env", environment, "--body", value], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) === 0;
}

/**
 * Ensures the GitHub `production` environment exists (no reviewers).
 *
 * @param root - Repository root
 * @param github - Parsed GitHub repository
 */
export async function ensureGhProductionEnvironment(
  root: string,
  github: GitHubRepo,
): Promise<boolean> {
  const proc = Bun.spawn(
    [
      "gh",
      "api",
      "-X",
      "PUT",
      `repos/${github.org}/${github.repo}/environments/production`,
      "-f",
      "wait_timer=0",
    ],
    {
      cwd: root,
      stdout: "ignore",
      stderr: "pipe",
    },
  );
  return (await proc.exited) === 0;
}
