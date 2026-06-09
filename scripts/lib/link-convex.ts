/* eslint-disable no-console -- CLI wizard */
import { isConvexLinked } from "./convex-link";
import { exitWithManualAction, printManualAction } from "./manual-action";
import { CONVEX_DASHBOARD } from "./platform-urls";

/**
 * Runs `convex dev --once` (configure, codegen, push) from the repo root.
 *
 * @param root - Repository root
 * @returns Process exit code (0 = success)
 */
async function runConvexDevOnce(root: string): Promise<number> {
  console.log("\n→ bunx convex dev --once");
  const proc = Bun.spawn(["bunx", "convex", "dev", "--once"], {
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

/**
 * Links Convex interactively when the checkout has no deployment yet.
 *
 * @param root - Repository root
 * @returns Whether a deployment is linked after this step
 */
export async function ensureConvexLinkedInteractive(root: string): Promise<boolean> {
  if (isConvexLinked(root)) {
    return true;
  }

  console.log("\nConvex");
  printManualAction("Link Convex to this repository", [
    `Convex dashboard: ${CONVEX_DASHBOARD}`,
    "Setup runs `convex dev --once` next — complete browser login if prompted",
    "Choose a team and project name when asked (creating a new project is fine)",
  ]);

  await runConvexDevOnce(root);

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
