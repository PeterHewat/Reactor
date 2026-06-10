import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { readSpawnPipe } from "./spawn-io";

/**
 * Default Vercel CLI global config directory for this platform.
 */
export function vercelCliConfigDir(): string {
  const home = homedir();
  if (process.platform === "darwin") {
    return join(home, "Library", "Application Support", "com.vercel.cli");
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
    return join(appData, "com.vercel.cli");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? join(home, ".config");
  return join(xdg, "com.vercel.cli");
}

/**
 * Reads the bearer token from an active `vercel login` session, if present.
 */
export function readVercelCliSessionToken(): string | undefined {
  const authPath = join(vercelCliConfigDir(), "auth.json");
  if (!existsSync(authPath)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(authPath, "utf8")) as {
      token?: string;
      bearerToken?: string;
    };
    const token = parsed.token?.trim() || parsed.bearerToken?.trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

type CliCapture = { ok: boolean; stdout: string; stderr: string };

/**
 * Runs `bunx vercel` and captures output.
 *
 * @param root - Repository root
 * @param args - vercel subcommand and flags
 */
async function runVercelCli(root: string, args: string[]): Promise<CliCapture> {
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn(["bunx", "vercel", ...args], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch {
    return { ok: false, stdout: "", stderr: "" };
  }
  const code = await proc.exited;
  return {
    ok: code === 0,
    stdout: await readSpawnPipe(proc.stdout),
    stderr: await readSpawnPipe(proc.stderr),
  };
}

/**
 * Parses a bearer token from `vercel tokens add --format json` output.
 *
 * @param stdout - CLI stdout
 */
export function parseVercelTokenAddJson(stdout: string): string | undefined {
  try {
    const parsed = JSON.parse(stdout) as { bearerToken?: string; token?: { token?: string } };
    return parsed.bearerToken?.trim() || parsed.token?.token?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns whether `vercel tokens add` failed because the session is OAuth-only.
 *
 * @param stderr - CLI stderr
 */
export function isVercelClassicTokenRequired(stderr: string): boolean {
  return /classic.*token|oauth/i.test(stderr);
}

/**
 * Creates a classic personal access token via `vercel tokens add` (for CI / GitHub secrets).
 *
 * @param root - Repository root
 * @param name - Token label in the Vercel dashboard
 */
export async function mintVercelCiTokenViaCli(
  root: string,
  name: string,
): Promise<{ token: string } | { classicRequired: true } | null> {
  const result = await runVercelCli(root, ["tokens", "add", name, "--format", "json"]);
  if (result.ok) {
    const token = parseVercelTokenAddJson(result.stdout);
    return token ? { token } : null;
  }
  if (isVercelClassicTokenRequired(result.stderr)) {
    return { classicRequired: true };
  }
  return null;
}

/**
 * Resolves a Vercel API bearer token for setup API calls.
 *
 * Order: `VERCEL_TOKEN` env → active `vercel login` session → `vercel tokens add`.
 *
 * @param root - Repository root
 */
export async function resolveVercelApiToken(
  root: string,
): Promise<{ token: string; source: "env" | "cli_session" | "cli_minted" } | null> {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) {
    return { token: fromEnv, source: "env" };
  }

  const session = readVercelCliSessionToken();
  if (session) {
    return { token: session, source: "cli_session" };
  }

  const minted = await mintVercelCiTokenViaCli(root, "reactor-setup");
  if (minted && "token" in minted) {
    return { token: minted.token, source: "cli_minted" };
  }

  return null;
}
