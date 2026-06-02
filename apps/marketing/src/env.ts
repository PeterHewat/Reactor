import { asString, loadEnv } from "@repo/env-core/env";

const marketingEnvSchema = {
  repoUrl: { key: "PUBLIC_REPO_URL", parse: asString, optional: true },
  repoDefaultBranch: {
    key: "PUBLIC_REPO_DEFAULT_BRANCH",
    parse: asString,
    optional: true,
  },
} as const;

/**
 * Reads Astro `import.meta.env` as a string record for {@link loadEnv}.
 *
 * @returns Public env vars available at build/runtime
 */
function astroEnvSource(): Record<string, string | undefined> {
  return {
    PUBLIC_REPO_URL: import.meta.env.PUBLIC_REPO_URL,
    PUBLIC_REPO_DEFAULT_BRANCH: import.meta.env.PUBLIC_REPO_DEFAULT_BRANCH,
  };
}

/**
 * Reads marketing env vars when present. Does not throw — safe before repo URL is configured.
 *
 * @returns Parsed values (may be undefined)
 *
 * @example
 * const env = loadMarketingEnv();
 * if (env.repoUrl) { /* render repo link *\/ }
 */
export function loadMarketingEnv() {
  return loadEnv(marketingEnvSchema, astroEnvSource());
}
