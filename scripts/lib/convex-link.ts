import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isRealConvexDeployment } from "../../packages/config/env-placeholders";

/** Instructions printed when Convex codegen is required but not available. */
export const CONVEX_LINK_HELP = `
Convex is not linked — \`convex/_generated/\` is missing.

  1. bun run dev:convex          # log in, link project, write root .env.local
  2. bun run generate:convex     # refresh convex/_generated/
  3. bun run typecheck           # or: bun run test

Docs: docs/getting-started.md §2
`.trim();

/** Shown when codegen fails against a linked deployment. */
export const CONVEX_CODEGEN_FAILED_HELP = `
Convex codegen failed. Common fixes:

  • Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard (see convex/README.md)
  • Ensure convex/auth.config.ts matches your Clerk issuer
  • Re-run: bun run generate:convex

Docs: docs/getting-started.md §3
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

  return isRealConvexDeployment(match[1]!.trim());
}

/**
 * Returns whether `convex/_generated/` is present.
 *
 * @param root - Repository root
 */
export function hasConvexGenerated(root: string): boolean {
  return existsSync(resolve(root, "convex/_generated/api.d.ts"));
}
