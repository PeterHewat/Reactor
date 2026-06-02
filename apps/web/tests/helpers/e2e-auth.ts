import { isPlaceholderEnvValue } from "@repo/config/env-placeholders";

/**
 * Returns true when Clerk + Convex env is set for authenticated tasks E2E.
 */
export function isTasksE2EConfigured(): boolean {
  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const convexUrl = process.env.VITE_CONVEX_URL;
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const secret = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || !convexUrl || !email || !secret) {
    return false;
  }

  return !isPlaceholderEnvValue(publishableKey) && !isPlaceholderEnvValue(convexUrl);
}

/**
 * Clerk publishable key for `@clerk/testing` (maps from VITE_* in CI/local).
 */
export function clerkPublishableKeyForE2E(): string | undefined {
  return process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
}
