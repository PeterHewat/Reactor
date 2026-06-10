/* eslint-disable no-console -- CLI wizard */
import { isConvexLinked } from "./convex-link";
import { exitWithManualAction, printManualAction } from "./manual-action";
import { CONVEX_DASHBOARD } from "./platform-urls";

type ConvexDevOnceOptions = {
  configure?: "existing";
  projectSlug?: string;
  stdin?: "inherit" | "ignore";
};

/**
 * Runs `convex dev --once` (configure, codegen, push) from the repo root.
 *
 * @param root - Repository root
 * @param options - Optional non-interactive existing-project link flags
 * @returns Process exit code (0 = success)
 */
async function runConvexDevOnce(root: string, options?: ConvexDevOnceOptions): Promise<number> {
  const args = ["bunx", "convex", "dev", "--once"];
  if (options?.configure === "existing") {
    args.push("--configure", "existing");
  }
  if (options?.projectSlug) {
    args.push("--project", options.projectSlug);
  }
  console.log(`\n→ ${args.slice(1).join(" ")}`);
  const proc = Bun.spawn(args, {
    cwd: root,
    stdin: options?.stdin ?? "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

/**
 * Attempts to link a named existing Convex project without prompting.
 *
 * @param root - Repository root
 * @param projectSlug - Convex project slug (e.g. `reactor`)
 * @returns Whether linking succeeded
 */
export async function tryLinkExistingConvexProject(
  root: string,
  projectSlug: string,
): Promise<boolean> {
  const slug = projectSlug.trim();
  if (!slug) {
    return false;
  }
  const code = await runConvexDevOnce(root, {
    configure: "existing",
    projectSlug: slug,
    stdin: "ignore",
  });
  return code === 0 && isConvexLinked(root);
}

export type EnsureConvexLinkedOptions = {
  /** When true, Convex CLI is logged in — linking is automated via `convex dev --once`. */
  convexAuthenticated?: boolean;
  /** Product slug used to prefer an existing Convex project before creating a new one. */
  projectSlug?: string;
};

/**
 * Links Convex interactively when the checkout has no deployment yet.
 *
 * @param root - Repository root
 * @param options - When Convex CLI is already authenticated, skip ACTION REQUIRED copy
 * @returns Whether a deployment is linked after this step
 */
export async function ensureConvexLinkedInteractive(
  root: string,
  options?: EnsureConvexLinkedOptions,
): Promise<boolean> {
  if (isConvexLinked(root)) {
    return true;
  }

  console.log("\nConvex");
  if (options?.projectSlug) {
    console.log(`  Checking for existing Convex project "${options.projectSlug}"…`);
    if (await tryLinkExistingConvexProject(root, options.projectSlug)) {
      console.log(`✓ Convex linked (existing project ${options.projectSlug})`);
      return true;
    }
    console.log(`○ No existing project "${options.projectSlug}" — choose in the CLI prompt`);
  }

  if (options?.convexAuthenticated) {
    console.log("  Linking via `convex dev --once`…");
    console.log("  Prefer **choose an existing project** over creating a duplicate.");
  } else {
    printManualAction("Link Convex to this repository", [
      `Convex dashboard: ${CONVEX_DASHBOARD}`,
      "Setup runs `convex dev --once` next — complete browser login if prompted",
      "Prefer **choose an existing project** when one matches your product name",
    ]);
  }

  const code = await runConvexDevOnce(root, { configure: "existing" });
  if (code !== 0 || !isConvexLinked(root)) {
    await runConvexDevOnce(root);
  }

  if (!isConvexLinked(root)) {
    exitWithManualAction("Complete Convex linking", [
      `Convex dashboard: ${CONVEX_DASHBOARD}`,
      "Finish browser login and project configuration",
      "Resume setup: `bun run setup`",
    ]);
  }

  console.log("✓ Convex linked");
  return true;
}

/**
 * Pushes Convex functions after dashboard env vars change (e.g. Clerk issuer).
 *
 * @param root - Repository root
 */
export async function pushConvexDevOnce(root: string): Promise<void> {
  const code = await runConvexDevOnce(root);
  if (code !== 0) {
    console.warn("○ Convex push had errors — retry `bun run dev:convex` for daily development");
    return;
  }
  console.log("✓ Convex functions pushed");
}
