import { isPlaceholderEnvValue } from "@repo/config/env-placeholders";

/** Error message when authenticated tasks E2E env is incomplete. */
export const tasksE2EEnvMessage =
  "Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, VITE_CONVEX_URL, and VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env.local — see docs/development.md#e2e-tests-playwright";

/**
 * Clerk publishable key for `@clerk/testing` (maps from VITE_* in CI/local).
 */
export function clerkPublishableKeyForE2E(): string | undefined {
  return process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
}

/**
 * Returns human-readable issues when tasks E2E env is missing or misconfigured.
 */
export function getTasksE2EConfigIssues(): string[] {
  const issues: string[] = [];
  const publishableKey = clerkPublishableKeyForE2E();
  const convexUrl = process.env.VITE_CONVEX_URL;
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const secret = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || isPlaceholderEnvValue(publishableKey)) {
    issues.push("VITE_CLERK_PUBLISHABLE_KEY is missing or still a placeholder");
  } else if (!publishableKey.startsWith("pk_test_")) {
    issues.push(
      "VITE_CLERK_PUBLISHABLE_KEY must be a development key (pk_test_…) — production keys cannot run Playwright auth",
    );
  }

  if (!secret || isPlaceholderEnvValue(secret)) {
    issues.push("CLERK_SECRET_KEY is missing or still a placeholder");
  } else if (!secret.startsWith("sk_test_")) {
    issues.push(
      "CLERK_SECRET_KEY must be a development key (sk_test_…) — the Clerk testing token API rejects production keys",
    );
  }

  if (!convexUrl || isPlaceholderEnvValue(convexUrl)) {
    issues.push("VITE_CONVEX_URL is missing or still a placeholder");
  }

  if (!email || isPlaceholderEnvValue(email)) {
    issues.push("E2E_CLERK_USER_EMAIL is missing or still a placeholder");
  }

  return issues;
}

/**
 * Returns true when Clerk + Convex env is set for authenticated tasks E2E.
 */
export function isTasksE2EConfigured(): boolean {
  return getTasksE2EConfigIssues().length === 0;
}

/**
 * When true, Playwright runs only `home` / `routing` specs (no Clerk tasks).
 */
export function isPlaywrightUiOnly(): boolean {
  if (process.env.PLAYWRIGHT_UI_ONLY === "1") return true;
  if (process.env.PLAYWRIGHT_UI_ONLY === "0") return false;
  return !isTasksE2EConfigured();
}
