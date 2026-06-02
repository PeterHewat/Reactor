import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isRealConvexDeployment } from "../../packages/config/env-placeholders";

/** Instructions printed when Convex codegen is required but not available. */
export const CONVEX_LINK_HELP = `
Convex is not linked — \`convex/_generated/\` is missing.

  1. docs/getting-started.md §2 — Clerk (JWT Convex preset + publishable key)
  2. docs/getting-started.md §3a — CLERK_JWT_ISSUER_DOMAIN in Convex dashboard
  3. bun run dev:convex              # link project, write root .env.local
  4. bun scripts/generate-convex.ts  # if dev is not running

Docs: docs/getting-started.md §3
`.trim();

/** Shown when codegen fails against a linked deployment. */
export const CONVEX_CODEGEN_FAILED_HELP = `
Convex codegen failed. Common fixes:

  • Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard (getting-started §3a)
  • Ensure convex/auth.config.ts matches your Clerk issuer
  • Re-run: bun scripts/generate-convex.ts

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
