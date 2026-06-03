import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isRealConvexDeployment,
  parseDotenvAssignmentValue,
} from "../../packages/config/env-placeholders";

/** Instructions printed when Convex codegen is required but not available. */
export const CONVEX_LINK_HELP = `
Convex is not linked — \`convex/_generated/\` is missing.

  bun run dev:convex

See docs/getting-started.md
`.trim();

/** Shown when codegen fails against a linked deployment. */
export const CONVEX_CODEGEN_FAILED_HELP = `
Convex codegen failed. See docs/getting-started.md, then:

  bun scripts/generate-convex.ts
`.trim();

/**
 * Returns whether a Convex deployment is linked for this checkout.
 *
 * @param root - Repository root
 */
export function isConvexLinked(root: string): boolean {
  if (process.env.CONVEX_DEPLOY_KEY) {
    return true;
  }

  const fromEnv = process.env.CONVEX_DEPLOYMENT;
  if (fromEnv && isRealConvexDeployment(fromEnv)) {
    return true;
  }

  const envLocal = resolve(root, ".env.local");
  if (!existsSync(envLocal)) {
    return false;
  }

  const content = readFileSync(envLocal, "utf8");
  const match = content.match(/^CONVEX_DEPLOYMENT=(.+)$/m);
  if (!match) {
    return false;
  }

  return isRealConvexDeployment(parseDotenvAssignmentValue(match[1]!));
}

/**
 * Returns whether `convex/_generated/` is present.
 *
 * @param root - Repository root
 */
export function hasConvexGenerated(root: string): boolean {
  return existsSync(resolve(root, "convex/_generated/api.d.ts"));
}
