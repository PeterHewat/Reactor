/* eslint-disable no-console -- CLI wizard */
import { resolve } from "node:path";
import {
  frontendApiSlugFromPublishableKey,
  isClerkPublishableKey,
  isClerkSecretKey,
} from "./clerk-instance";
import { readEnvFile } from "./env-file";
import { printManualAction } from "./manual-action";
import { CLERK_API_KEYS, CLERK_CREATE_APP, clerkAppDashboardUrl } from "./platform-urls";
import { isInteractivePrompt, promptConfirm } from "./prompt";
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

export type ClerkAppRecord = {
  id: string;
  name: string;
  slug?: string;
  developmentPublishableKey?: string;
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
 * Extracts application rows from Clerk `apps list --json` payloads.
 *
 * @param parsed - Parsed JSON root
 */
function clerkAppsJsonItems(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (!parsed || typeof parsed !== "object") {
    return [];
  }
  const record = parsed as Record<string, unknown>;
  for (const key of ["data", "applications", "items", "apps"] as const) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }
  return [];
}

/**
 * Parses `clerk apps list --json` output into app records (with dev publishable keys when present).
 *
 * @param stdout - Raw CLI stdout
 */
export function parseClerkAppRecords(stdout: string): ClerkAppRecord[] {
  try {
    const items = clerkAppsJsonItems(JSON.parse(stdout) as unknown);
    return items
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as {
          id?: string;
          application_id?: string;
          name?: string;
          slug?: string;
          instances?: Array<{ environment_type?: string; publishable_key?: string }>;
        };
        const id = record.id?.trim() || record.application_id?.trim();
        if (!id) {
          return null;
        }
        const slug = record.slug?.trim();
        const name = (record.name ?? slug ?? id).trim();
        const developmentPublishableKey = record.instances
          ?.find((instance) => instance.environment_type === "development")
          ?.publishable_key?.trim();
        const app: ClerkAppRecord = { id, name };
        if (slug) {
          app.slug = slug;
        }
        if (developmentPublishableKey) {
          app.developmentPublishableKey = developmentPublishableKey;
        }
        return app;
      })
      .filter((item): item is ClerkAppRecord => item !== null);
  } catch {
    const fromPlain = parseClerkAppsListPlain(stdout);
    if (fromPlain.length > 0) {
      return fromPlain;
    }
    const id = extractClerkAppId(stdout);
    return id ? [{ id, name: id }] : [];
  }
}

/**
 * Parses human-readable `clerk apps list` table output.
 *
 * @param stdout - Raw CLI stdout (NAME / APP ID table)
 */
export function parseClerkAppsListPlain(stdout: string): ClerkAppRecord[] {
  const records: ClerkAppRecord[] = [];
  for (const line of stdout.split("\n")) {
    const match = line.match(/^(.+?)\s+(app_[a-zA-Z0-9]+)\s+/);
    if (!match) {
      continue;
    }
    const name = match[1]!.trim();
    const id = match[2]!;
    if (name === "NAME") {
      continue;
    }
    records.push({ id, name });
  }
  return records;
}

/**
 * Parses `clerk apps list --json` output into app id/name pairs.
 *
 * @param stdout - Raw CLI stdout
 */
export function parseClerkAppsList(stdout: string): Array<{ id: string; name: string }> {
  return parseClerkAppRecords(stdout).map(({ id, name }) => ({ id, name }));
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
  const matches = await findClerkAppsByName(clerk, root, productName);
  return matches[0];
}

/**
 * Lists Clerk applications matching a display name (case-insensitive).
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param productName - Application name from setup config
 */
export async function findClerkAppsByName(
  clerk: CliToolState,
  root: string,
  productName: string,
): Promise<ClerkAppRecord[]> {
  const want = productName.trim().toLowerCase();
  const apps = await listClerkAppRecords(clerk, root);
  return apps.filter((app) => app.name.toLowerCase() === want);
}

/**
 * Finds a Clerk app whose Development publishable key matches `pk_test_…` from env.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param publishableKey - `VITE_CLERK_PUBLISHABLE_KEY` from `apps/web/.env.local`
 */
export async function findClerkAppByPublishableKey(
  clerk: CliToolState,
  root: string,
  publishableKey: string,
): Promise<ClerkAppRecord | undefined> {
  const want = publishableKey.trim();
  const apps = await listClerkAppRecords(clerk, root);
  const byKey = apps.find((app) => app.developmentPublishableKey === want);
  if (byKey) {
    return byKey;
  }
  const issuerSlug = frontendApiSlugFromPublishableKey(want);
  if (!issuerSlug) {
    return undefined;
  }
  return apps.find((app) => app.slug === issuerSlug);
}

/**
 * Lists Clerk applications visible to the logged-in account.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
export async function listClerkAppRecords(
  clerk: CliToolState,
  root: string,
): Promise<ClerkAppRecord[]> {
  const jsonResult = await runClerkCli(clerk.command, ["apps", "list", "--json"], { cwd: root });
  if (jsonResult.ok) {
    const records = parseClerkAppRecords(jsonResult.stdout);
    if (records.length > 0) {
      return records;
    }
  } else {
    const detail = jsonResult.stderr.trim() || jsonResult.stdout.trim();
    if (detail) {
      console.log(`○ clerk apps list --json failed: ${detail.slice(0, 200)}`);
    }
  }

  const plainResult = await runClerkCli(clerk.command, ["apps", "list"], { cwd: root });
  if (plainResult.ok) {
    return parseClerkAppsListPlain(plainResult.stdout);
  }

  const detail = plainResult.stderr.trim() || plainResult.stdout.trim();
  if (detail) {
    console.log(`○ clerk apps list failed: ${detail.slice(0, 200)}`);
  }
  return [];
}

/**
 * Lists Clerk application id/name pairs.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
export async function listClerkApps(
  clerk: CliToolState,
  root: string,
): Promise<Array<{ id: string; name: string }>> {
  const records = await listClerkAppRecords(clerk, root);
  return records.map(({ id, name }) => ({ id, name }));
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
  const withJson = await runClerkCli(clerk.command, ["apps", "create", "--name", name, "--json"], {
    cwd: root,
  });
  if (withJson.ok) {
    const fromJson =
      extractClerkAppId(withJson.stdout) ?? parseClerkAppsList(withJson.stdout)[0]?.id;
    if (fromJson) {
      return fromJson;
    }
  }
  const plain = await runClerkCli(clerk.command, ["apps", "create", "--name", name], { cwd: root });
  if (!plain.ok) {
    const detail = plain.stderr.trim() || plain.stdout.trim();
    if (detail) {
      console.log(`○ clerk apps create failed: ${detail}`);
    }
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
 * Removes the local git-repo link to a Clerk application (`~/.clerk/config.json`).
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
export async function unlinkClerkProject(clerk: CliToolState, root: string): Promise<boolean> {
  const result = await runClerkCli(clerk.command, ["unlink", "--yes"], { cwd: root });
  return result.ok;
}

/**
 * Returns whether a Clerk application still exists for the logged-in account.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 * @param appId - Clerk application ID (`app_…`)
 */
export async function verifyClerkAppExists(
  clerk: CliToolState,
  root: string,
  appId: string,
): Promise<boolean> {
  const detail = await runClerkCli(clerk.command, ["apps", "get", appId, "--json"], {
    cwd: root,
  });
  if (detail.ok) {
    return true;
  }
  const apps = await listClerkApps(clerk, root);
  return apps.some((app) => app.id === appId);
}

/**
 * Whether Clerk CLI output indicates Production has not been provisioned yet.
 *
 * @param detail - stderr or stdout from Clerk CLI
 */
export function isClerkProductionMissingError(detail: string): boolean {
  const lower = detail.toLowerCase();
  return (
    lower.includes("instance_not_found") ||
    lower.includes("production instance") ||
    lower.includes("no production") ||
    lower.includes("not deployed to production")
  );
}

/**
 * Runs `clerk deploy` in the foreground so the interactive production wizard can run.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
async function runClerkDeployInteractive(clerk: CliToolState, root: string): Promise<boolean> {
  console.log(`\n→ ${[...clerk.command, "deploy"].join(" ")}`);
  console.log("  Complete the Clerk deploy wizard in this terminal (domain, DNS, OAuth, etc.)");
  const code = await Bun.spawn([...clerk.command, "deploy"], {
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
  return code === 0;
}

/**
 * Provisions Clerk Production via `clerk deploy`, refreshes the git link, and pulls live keys.
 *
 * @param clerk - Clerk CLI state
 * @param root - Repository root
 */
export async function deployClerkProduction(
  clerk: CliToolState,
  root: string,
): Promise<ClerkProductionKeys | null> {
  if (!isInteractivePrompt()) {
    console.log(
      "○ `clerk deploy` needs an interactive terminal — run `bunx clerk deploy` manually",
    );
    return null;
  }

  if (!(await runClerkDeployInteractive(clerk, root))) {
    console.log("○ clerk deploy did not finish successfully");
    return null;
  }

  const appId = await readLinkedClerkAppId(clerk, root);
  if (appId) {
    console.log(`→ Refreshing Clerk link (${appId})`);
    await linkClerkApp(clerk, root, appId);
  }

  const pulled = await pullClerkProductionEnv(clerk, root);
  if (pulled) {
    console.log("✓ Clerk Production keys pulled");
    return pulled;
  }

  const appHint = appId ? clerkAppDashboardUrl(appId) : CLERK_CREATE_APP;
  console.log(`○ Production keys still unavailable — open ${appHint} and finish deploy`);
  return null;
}

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
    if (isClerkProductionMissingError(detail)) {
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
    if (await verifyClerkAppExists(clerk, root, existing)) {
      console.log(`✓ Clerk app linked (${existing})`);
      console.log(`  Dashboard: ${clerkAppDashboardUrl(existing)}`);
      return existing;
    }
    console.warn(`○ Stale Clerk link (${existing}) — not found in your Clerk account`);
    if (await unlinkClerkProject(clerk, root)) {
      console.log("✓ Cleared stale Clerk link — will create or link a new app");
    } else {
      printManualAction("Clear the stale Clerk link", [
        `Run: ${[...clerk.command, "unlink", "--yes"].join(" ")}`,
        `Then create an app: ${CLERK_CREATE_APP} or \`${[...clerk.command, "apps", "create", "--name", setup.productName].join(" ")}\``,
        `Link it: ${[...clerk.command, "link", "--app", "app_…"].join(" ")}`,
        "Re-run `bun run setup`",
      ]);
      return undefined;
    }
  }

  const webEnv = readEnvFile(root, WEB_ENV);
  const envPk = webEnv.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const byKey =
    envPk && isClerkPublishableKey(envPk)
      ? await findClerkAppByPublishableKey(clerk, root, envPk)
      : undefined;

  const apps = await listClerkApps(clerk, root);
  const byName = await findClerkAppsByName(clerk, root, setup.productName);
  if (byName.length > 1) {
    console.warn(
      `○ ${byName.length} Clerk apps named "${setup.productName}" — linking ${byName[0]!.id} (delete extras in the dashboard if unintended)`,
    );
  }
  if (byKey && byName[0] && byKey.id !== byName[0].id) {
    console.log(
      `○ ${WEB_ENV} publishable key matches "${byKey.name}" (${byKey.id}), not the app named "${setup.productName}"`,
    );
  }
  const toLink = byKey ?? byName[0] ?? (apps.length === 1 ? apps[0] : undefined);
  if (toLink) {
    console.log(`→ Linking Clerk app ${toLink.name} (${toLink.id})`);
    if (await linkClerkApp(clerk, root, toLink.id)) {
      return toLink.id;
    }
  } else if (apps.length > 1) {
    console.log(`○ ${apps.length} Clerk apps found — none named "${setup.productName}"`);
    for (const app of apps) {
      console.log(`    • ${app.name} (${app.id})`);
    }
    printManualAction(`Link an existing Clerk app`, [
      `Run: ${[...clerk.command, "link"].join(" ")} and pick from the list`,
      `Or: ${[...clerk.command, "link", "--app", "app_…"].join(" ")}`,
      `Dashboard: ${CLERK_CREATE_APP}`,
    ]);
    return undefined;
  }

  const create = await promptConfirm(`Create Clerk application "${setup.productName}"?`, {
    defaultYes: apps.length === 0,
  });
  if (create) {
    console.log(
      `\n→ ${[...clerk.command, "apps", "create", "--name", setup.productName].join(" ")}`,
    );
    const created = await createClerkApp(clerk, root, setup.productName);
    if (created && (await linkClerkApp(clerk, root, created))) {
      console.log(`✓ Created and linked Clerk app (${created})`);
      return created;
    }
    console.log("○ Could not create Clerk app via CLI");
  }

  printManualAction("Create and link a Clerk application", [
    `Dashboard: ${CLERK_CREATE_APP} → **Create application** (sign in as the same user as \`bunx clerk whoami\`)`,
    `Or CLI: ${[...clerk.command, "apps", "create", "--name", setup.productName].join(" ")}`,
    `Then link: ${[...clerk.command, "link", "--app", "app_…"].join(" ")}`,
    `If \`whoami\` shows a link but \`apps list\` is empty, run ${[...clerk.command, "unlink", "--yes"].join(" ")} first`,
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
