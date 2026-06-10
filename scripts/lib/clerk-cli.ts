/* eslint-disable no-console -- CLI wizard */
import { resolve } from "node:path";
import { isClerkPublishableKey, isClerkSecretKey } from "./clerk-instance";
import { readEnvFile } from "./env-file";
import { printManualAction } from "./manual-action";
import { CLERK_API_KEYS, CLERK_CREATE_APP, CLERK_DASHBOARD } from "./platform-urls";
import { promptConfirm } from "./prompt";
import { readSpawnPipe } from "./spawn-io";
import type { SetupConfig } from "./setup-config";
import type { CliToolState } from "./setup-cli";

const WEB_ENV = "apps/web/.env.local";
const CLERK_PROD_ENV = ".reactor/clerk-production.env";

export type ClerkProductionKeys = {
  publishableKey: string;
  secretKey: string;
};

export type ClerkCliRunResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
};

/**
 * Runs a Clerk CLI command and captures stdout/stderr.
 *
 * @param command - argv prefix for Clerk (e.g. `["bunx", "clerk"]`)
 * @param args - Subcommand and flags
 * @param options - Optional working directory
 */
export async function runClerkCli(
  command: string[],
  args: string[],
  options?: { cwd?: string },
): Promise<ClerkCliRunResult> {
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn([...command, ...args], {
      cwd: options?.cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    const missing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT";
    if (missing) {
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
 * Extracts a Clerk application ID from CLI output.
 *
 * @param text - stdout or JSON from Clerk CLI
 */
export function extractClerkAppId(text: string): string | undefined {
  const match = text.match(/app_[a-zA-Z0-9]+/);
  return match?.[0];
}

/**
 * Parses `clerk apps list --json` output into app records.
 *
 * @param stdout - Raw CLI stdout
 */
export function parseClerkAppsList(stdout: string): Array<{ id: string; name: string }> {
  try {
    const parsed = JSON.parse(stdout) as unknown;
    const items = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { data?: unknown }).data)
        ? (parsed as { data: unknown[] }).data
        : [];
    return items
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as { id?: string; name?: string; slug?: string };
        const id = record.id?.trim();
        if (!id) {
          return null;
        }
        const name = (record.name ?? record.slug ?? id).trim();
        return { id, name };
      })
      .filter((item): item is { id: string; name: string } => item !== null);
  } catch {
    const id = extractClerkAppId(stdout);
    return id ? [{ id, name: id }] : [];
  }
}

/**
 * Returns the linked Clerk application ID from `clerk whoami`, if any.
 *
 * @param clerk - Clerk CLI state from setup prerequisites
 * @param root - Repository root
 */
export async function readLinkedClerkAppId(
  clerk: CliToolState,
  root: string,
): Promise<string | undefined> {
  const json = await runClerkCli(clerk.command, ["whoami", "--json"], { cwd: root });
  if (json.ok) {
    try {
      const parsed = JSON.parse(json.stdout) as {
        application?: { id?: string };
        app?: { id?: string };
      };
      const fromApp = parsed.application?.id ?? parsed.app?.id;
      if (fromApp) {
        return fromApp;
      }
    } catch {
      // fall through to text parse
    }
  }
  const text = await runClerkCli(clerk.command, ["whoami"], { cwd: root });
  return text.ok ? extractClerkAppId(text.stdout) : undefined;
}

/**
 * Lists Clerk applications visible to the logged-in account.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
/**
 * Finds a Clerk application by display name (case-insensitive).
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param productName - Application name from setup config
 */
export async function findClerkAppByName(
  clerk: CliToolState,
  root: string,
  productName: string,
): Promise<{ id: string; name: string } | undefined> {
  const want = productName.trim().toLowerCase();
  const apps = await listClerkApps(clerk, root);
  return apps.find((app) => app.name.toLowerCase() === want);
}

export async function listClerkApps(
  clerk: CliToolState,
  root: string,
): Promise<Array<{ id: string; name: string }>> {
  const result = await runClerkCli(clerk.command, ["apps", "list", "--json"], { cwd: root });
  if (!result.ok) {
    return [];
  }
  return parseClerkAppsList(result.stdout);
}

/**
 * Creates a Clerk application and returns its ID.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param name - Application display name
 */
export async function createClerkApp(
  clerk: CliToolState,
  root: string,
  name: string,
): Promise<string | undefined> {
  const withJson = await runClerkCli(clerk.command, ["apps", "create", name, "--json"], {
    cwd: root,
  });
  if (withJson.ok) {
    const fromJson =
      extractClerkAppId(withJson.stdout) ?? parseClerkAppsList(withJson.stdout)[0]?.id;
    if (fromJson) {
      return fromJson;
    }
  }
  const plain = await runClerkCli(clerk.command, ["apps", "create", name], { cwd: root });
  if (!plain.ok) {
    return undefined;
  }
  return extractClerkAppId(plain.stdout);
}

/**
 * Links the checkout to a Clerk application.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param appId - Clerk application ID (`app_…`)
 */
export async function linkClerkApp(
  clerk: CliToolState,
  root: string,
  appId: string,
): Promise<boolean> {
  const result = await runClerkCli(clerk.command, ["link", "--app", appId], { cwd: root });
  return result.ok;
}

/**
 * Pulls Development Clerk keys into `apps/web/.env.local` via `clerk env pull`.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
/**
 * Pulls Production Clerk keys into `.reactor/clerk-production.env` (not committed).
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
export async function pullClerkProductionEnv(
  clerk: CliToolState,
  root: string,
): Promise<ClerkProductionKeys | null> {
  const relPath = CLERK_PROD_ENV;
  const args = ["env", "pull", "--instance", "prod", "--file", relPath];
  console.log(`\n→ ${[...clerk.command, ...args].join(" ")}`);
  const result = await runClerkCli(clerk.command, args, { cwd: root });
  if (!result.ok) {
    const detail = result.stderr.trim() || result.stdout.trim();
    console.log(`○ clerk env pull --instance prod failed${detail ? `: ${detail}` : ""}`);
    if (detail.includes("instance_not_found")) {
      console.log(
        "  Provision Clerk Production first: `bunx clerk deploy` or the Clerk dashboard → Deploy to production",
      );
    }
    return null;
  }

  const env = readEnvFile(root, relPath);
  const publishableKey =
    env.VITE_CLERK_PUBLISHABLE_KEY?.trim() || env.CLERK_PUBLISHABLE_KEY?.trim() || "";
  const secretKey = env.CLERK_SECRET_KEY?.trim() || "";
  if (
    !isClerkPublishableKey(publishableKey) ||
    !publishableKey.startsWith("pk_live_") ||
    !isClerkSecretKey(secretKey) ||
    !secretKey.startsWith("sk_live_")
  ) {
    console.log("○ Production Clerk keys missing or invalid after env pull");
    return null;
  }

  console.log(`✓ Pulled Clerk Production keys → ${relPath}`);
  return { publishableKey, secretKey };
}

export async function pullClerkEnv(clerk: CliToolState, root: string): Promise<boolean> {
  const webDir = resolve(root, "apps/web");
  console.log(`\n→ ${[...clerk.command, "env", "pull", "--file", ".env.local"].join(" ")}`);
  const result = await runClerkCli(clerk.command, ["env", "pull", "--file", ".env.local"], {
    cwd: webDir,
  });
  if (!result.ok) {
    console.log(`○ clerk env pull failed${result.stderr ? `: ${result.stderr}` : ""}`);
    return false;
  }
  console.log(`✓ Pulled Clerk Development keys → ${WEB_ENV}`);
  return true;
}

/**
 * Ensures a Clerk app is linked, creating one when the user confirms.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param setup - Setup config (product name for new apps)
 */
async function ensureClerkAppLinked(
  clerk: CliToolState,
  root: string,
  setup: SetupConfig,
): Promise<string | undefined> {
  const existing = await readLinkedClerkAppId(clerk, root);
  if (existing) {
    console.log(`✓ Clerk app linked (${existing})`);
    return existing;
  }

  const apps = await listClerkApps(clerk, root);
  const byName = await findClerkAppByName(clerk, root, setup.productName);
  const toLink = byName ?? (apps.length === 1 ? apps[0] : undefined);
  if (toLink) {
    console.log(`→ Linking Clerk app ${toLink.name} (${toLink.id})`);
    if (await linkClerkApp(clerk, root, toLink.id)) {
      return toLink.id;
    }
  } else if (apps.length > 1) {
    console.log(`○ ${apps.length} Clerk apps found — none match "${setup.productName}"`);
  }

  const create = await promptConfirm(`Create Clerk application "${setup.productName}"?`, {
    defaultYes: true,
  });
  if (create) {
    console.log(`\n→ ${[...clerk.command, "apps", "create", setup.productName].join(" ")}`);
    const created = await createClerkApp(clerk, root, setup.productName);
    if (created && (await linkClerkApp(clerk, root, created))) {
      console.log(`✓ Created and linked Clerk app (${created})`);
      return created;
    }
    console.log("○ Could not create Clerk app via CLI");
  }

  printManualAction("Link a Clerk application", [
    `Create an application: ${CLERK_CREATE_APP}`,
    `Or list apps: ${[...clerk.command, "apps", "list"].join(" ")}`,
    `Then link: ${[...clerk.command, "link", "--app", "app_…"].join(" ")}`,
    `Dashboard: ${CLERK_DASHBOARD}`,
  ]);
  return undefined;
}

/**
 * Pulls Clerk keys via CLI when authenticated; returns whether valid dev keys are present.
 *
 * @param root - Repository root
 * @param setup - Setup config
 * @param clerk - Clerk CLI state from prerequisites
 */
export async function bootstrapClerkEnvViaCli(
  root: string,
  setup: SetupConfig,
  clerk: CliToolState,
): Promise<boolean> {
  console.log("\nClerk");
  console.log("  Using Clerk CLI — https://clerk.com/docs/cli");

  const linked = await ensureClerkAppLinked(clerk, root, setup);
  if (!linked) {
    return false;
  }

  if (!(await pullClerkEnv(clerk, root))) {
    return false;
  }

  const webEnv = readEnvFile(root, WEB_ENV);
  const publishableKey = webEnv.VITE_CLERK_PUBLISHABLE_KEY;
  const secretKey = webEnv.CLERK_SECRET_KEY;
  const keysOk =
    isClerkPublishableKey(publishableKey ?? "") &&
    isClerkSecretKey(secretKey ?? "") &&
    publishableKey!.startsWith("pk_test_") &&
    secretKey!.startsWith("sk_test_");

  if (!keysOk) {
    console.log(`○ ${WEB_ENV} is missing valid Development Clerk keys after env pull`);
    printManualAction("Paste Clerk Development keys manually", [
      `API keys (Development): ${CLERK_API_KEYS}`,
      `Or retry: ${[...clerk.command, "env", "pull", "--file", ".env.local"].join(" ")} (from apps/web)`,
    ]);
    return false;
  }

  return true;
}
