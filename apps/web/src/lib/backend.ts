import { loadWebEnv } from "../env";

/**
 * Whether Convex is configured (VITE_CONVEX_URL set).
 * UI-only dev works without this.
 */
export function isBackendEnabled(): boolean {
  const { convexUrl } = loadWebEnv();
  return Boolean(convexUrl);
}

/**
 * Whether Clerk + Convex auth wiring is configured.
 * Required for the tasks vertical slice.
 */
export function isAuthEnabled(): boolean {
  const { convexUrl, clerkPublishableKey } = loadWebEnv();
  return Boolean(convexUrl && clerkPublishableKey);
}
