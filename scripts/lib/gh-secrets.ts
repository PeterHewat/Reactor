import type { GitHubRepo } from "./repo-identity";
import { readSpawnPipe } from "./spawn-io";

/** OAuth scopes required for GitHub Actions environments and environment secrets. */
export const GH_ACTIONS_SCOPES = ["repo", "workflow"] as const;

/**
 * Returns whether a spawn error means the executable is missing from PATH.
 *
 * @param error - Caught spawn error
 */
function isMissingExecutableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

/**
 * Runs a command and captures stdout/stderr.
 *
 * @param command - Executable and arguments
 * @param options - Optional working directory
 */
async function runCapture(
  command: string[],
  options?: { cwd?: string },
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn(command, {
      cwd: options?.cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    if (isMissingExecutableError(error)) {
      return { ok: false, stdout: "", stderr: "" };
    }
    throw error;
  }
  const code = await proc.exited;
  const stdout = await readSpawnPipe(proc.stdout);
  const stderr = await readSpawnPipe(proc.stderr);
  return { ok: code === 0, stdout, stderr };
}

/**
 * Parses scope names from `gh auth status` output.
 *
 * @param authStatusOutput - Combined stdout/stderr from `gh auth status`
 */
export function parseGhTokenScopes(authStatusOutput: string): string[] {
  const match = authStatusOutput.match(/Token scopes:\s*(.+)/);
  if (!match?.[1]) {
    return [];
  }
  return match[1]
    .replace(/'/g, "")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

/**
 * Returns whether the token includes scopes for Actions environments and secrets.
 *
 * @param scopes - Parsed OAuth scope names
 */
export function hasGhActionsScopes(scopes: string[]): boolean {
  return GH_ACTIONS_SCOPES.every((scope) => scopes.includes(scope));
}

/**
 * Returns OAuth scopes on the active `gh` session.
 *
 * @param root - Optional repository root for `cwd`
 */
export async function getGhTokenScopes(root?: string): Promise<string[]> {
  const capture = await runCapture(["gh", "auth", "status"], { cwd: root });
  const output = [capture.stdout, capture.stderr].filter(Boolean).join("\n");
  return parseGhTokenScopes(output);
}

/**
 * Refreshes the GitHub CLI token with repo + workflow scopes (interactive browser step).
 *
 * @param root - Repository root
 */
export async function refreshGhActionsScopes(root: string): Promise<boolean> {
  try {
    const proc = Bun.spawn(["gh", "auth", "refresh", "-h", "github.com", "-s", "repo,workflow"], {
      cwd: root,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    return (await proc.exited) === 0;
  } catch (error) {
    if (isMissingExecutableError(error)) {
      return false;
    }
    throw error;
  }
}

/**
 * Returns whether the GitHub CLI is installed on PATH.
 */
export async function isGhInstalled(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["gh", "--version"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    return (await proc.exited) === 0;
  } catch (error) {
    if (isMissingExecutableError(error)) {
      return false;
    }
    throw error;
  }
}

/**
 * Returns whether the GitHub CLI is authenticated.
 */
export async function isGhAuthenticated(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["gh", "auth", "status"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    return (await proc.exited) === 0;
  } catch (error) {
    if (isMissingExecutableError(error)) {
      return false;
    }
    throw error;
  }
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
 * Lists GitHub Actions repository secret names via `gh secret list`.
 *
 * @param root - Repository root
 */
export async function listGhRepoSecrets(root: string): Promise<string[]> {
  const capture = await runCapture(["gh", "secret", "list", "--json", "name", "-q", ".[].name"], {
    cwd: root,
  });
  if (!capture.ok) {
    return [];
  }
  return capture.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
 * Returns whether a named GitHub Actions environment exists.
 *
 * @param root - Repository root
 * @param github - Parsed GitHub repository
 * @param environmentName - Environment slug (e.g. `production`)
 */
export async function ghEnvironmentExists(
  root: string,
  github: GitHubRepo,
  environmentName: string,
): Promise<boolean> {
  const capture = await runCapture(
    ["gh", "api", `repos/${github.org}/${github.repo}/environments/${environmentName}`],
    { cwd: root },
  );
  return capture.ok;
}

/** Result of ensuring the GitHub `production` environment exists. */
export type EnsureGhEnvironmentResult =
  | { ok: true }
  | { ok: false; message: string; needsScopeRefresh: boolean };

/**
 * Ensures the GitHub `production` environment exists (no reviewers).
 *
 * @param root - Repository root
 * @param github - Parsed GitHub repository
 */
export async function ensureGhProductionEnvironment(
  root: string,
  github: GitHubRepo,
): Promise<EnsureGhEnvironmentResult> {
  if (await ghEnvironmentExists(root, github, "production")) {
    return { ok: true };
  }

  const path = `repos/${github.org}/${github.repo}/environments/production`;
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn(["gh", "api", "-X", "PUT", path, "--input", "-"], {
      cwd: root,
      stdin: new Blob(["{}"], { type: "application/json" }),
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    if (isMissingExecutableError(error)) {
      return { ok: false, message: "GitHub CLI (`gh`) not found", needsScopeRefresh: false };
    }
    throw error;
  }

  const code = await proc.exited;
  if (code === 0) {
    return { ok: true };
  }

  const stderr = await readSpawnPipe(proc.stderr);
  const scopes = await getGhTokenScopes(root);
  const needsScopeRefresh = /forbidden|403/i.test(stderr) && !hasGhActionsScopes(scopes);

  return {
    ok: false,
    message: stderr || `gh api PUT ${path} failed (exit ${code})`,
    needsScopeRefresh,
  };
}
