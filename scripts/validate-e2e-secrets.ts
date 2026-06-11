#!/usr/bin/env bun
/* eslint-disable no-console -- CI resolver writes GitHub Actions output */
/**
 * Resolves web Playwright E2E mode for CI (`ui_only` vs full tasks suite).
 *
 * Prints `ui_only=true|false` for `$GITHUB_OUTPUT` when stdout is not a TTY.
 * Exits 1 when `REQUIRE_FULL_WEB_E2E=true` and secrets are missing or invalid.
 */
import { getTasksE2EConfigIssues } from "../apps/web/tests/helpers/e2e-auth.ts";
import { verifyClerkE2ESecrets } from "./lib/e2e-secrets.ts";

const requireFull = process.env.REQUIRE_FULL_WEB_E2E === "true";

function fail(message: string): never {
  if (requireFull) {
    console.error(`::error::${message}`);
    process.exit(1);
  }
  console.log("ui_only=true");
  console.error(`::notice::${message} Running UI-only Playwright (home, routing).`);
  process.exit(0);
}

const syncIssues = getTasksE2EConfigIssues();
if (syncIssues.length > 0) {
  const remediation = syncIssues.some((issue) => issue.includes("E2E_CLERK_USER_EMAIL"))
    ? " Set repository secret E2E_CLERK_USER_EMAIL via `bun run setup` or `gh secret set E2E_CLERK_USER_EMAIL` (docs/ci-cd.md#repository-secrets)."
    : "";
  fail(`Web E2E secrets incomplete: ${syncIssues.join("; ")}.${remediation}`);
}

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY!;
const secretKey = process.env.CLERK_SECRET_KEY!;
const clerkCheck = await verifyClerkE2ESecrets(publishableKey, secretKey);
if (!clerkCheck.ok) {
  fail(clerkCheck.message);
}

console.log("ui_only=false");
