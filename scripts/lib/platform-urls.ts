import type { GitHubRepo } from "./repo-identity";

export const CLERK_DASHBOARD = "https://dashboard.clerk.com";
export const CLERK_CREATE_APP = "https://dashboard.clerk.com/apps";
/** Prefer {@link clerkAppDashboardUrl} when you have an app id — `last-active` needs a browser session app. */
export const CLERK_API_KEYS = "https://dashboard.clerk.com/last-active?path=api-keys";

/**
 * Clerk dashboard URL for one application (`app_…`).
 *
 * @param appId - Clerk application ID
 */
export function clerkAppDashboardUrl(appId: string): string {
  return `https://dashboard.clerk.com/apps/${appId}`;
}
export const CLERK_DOMAINS = "https://dashboard.clerk.com/last-active?path=domains";
export const CLERK_JWT_TEMPLATES = "https://dashboard.clerk.com/last-active?path=jwt-templates";
export const CONVEX_DASHBOARD = "https://dashboard.convex.dev";
export const VERCEL_DASHBOARD = "https://vercel.com/dashboard";
export const VERCEL_NEW_PROJECT = "https://vercel.com/new";
export const VERCEL_TOKENS = "https://vercel.com/account/tokens";
export const VERCEL_LOGIN_CONNECTIONS = "https://vercel.com/account/login-connections";
export const VERCEL_GITHUB_APP = "https://github.com/apps/vercel";

/**
 * GitHub Actions secrets settings URL for a repository.
 *
 * @param github - Parsed GitHub repository
 */
export function githubSecretsUrl(github: GitHubRepo): string {
  return `https://github.com/${github.org}/${github.repo}/settings/secrets/actions`;
}

/**
 * GitHub Environments settings URL for a repository.
 *
 * @param github - Parsed GitHub repository
 */
export function githubEnvironmentsUrl(github: GitHubRepo): string {
  return `https://github.com/${github.org}/${github.repo}/settings/environments`;
}
