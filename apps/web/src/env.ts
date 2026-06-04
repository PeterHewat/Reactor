import { asString, loadEnv } from "@repo/utils/env";

const webEnvSchema = {
  convexUrl: { key: "VITE_CONVEX_URL", parse: asString },
  clerkPublishableKey: {
    key: "VITE_CLERK_PUBLISHABLE_KEY",
    parse: asString,
    optional: true,
  },
} as const;

/**
 * Reads `import.meta.env` as a string record for {@link loadEnv}.
 *
 * @returns Vite `VITE_*` variables available at build/runtime
 */
function viteEnvSource(): Record<string, string | undefined> {
  return {
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  };
}

/**
 * Reads web env vars when present. Does not throw — safe for the starter template
 * before you link a Convex or Clerk project.
 *
 * @returns Parsed values (may be undefined)
 *
 * @example
 * const env = loadWebEnv();
 * if (env.convexUrl) { /* wire ConvexProvider *\/ }
 */
export function loadWebEnv() {
  return loadEnv(
    {
      convexUrl: { ...webEnvSchema.convexUrl, optional: true },
      clerkPublishableKey: webEnvSchema.clerkPublishableKey,
    },
    viteEnvSource(),
  );
}

/**
 * Validates required web env and fails fast. Call when enabling Convex in `main.tsx`
 * (after `bun run dev:convex` and copying `VITE_CONVEX_URL` into `apps/web/.env.local`).
 *
 * @returns Parsed Convex URL and optional Clerk publishable key
 * @throws Error when `VITE_CONVEX_URL` is missing or empty
 *
 * @example
 * const { convexUrl } = requireWebEnv();
 * const client = new ConvexReactClient(convexUrl);
 */
export function requireWebEnv() {
  return loadEnv(webEnvSchema, viteEnvSource());
}
