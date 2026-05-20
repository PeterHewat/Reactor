/**
 * Requires a non-empty Convex environment variable.
 *
 * @param name - Dashboard variable name (e.g. `CLERK_JWT_ISSUER_DOMAIN`)
 * @returns Trimmed value
 * @throws Error when missing or blank
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in the Convex dashboard (Settings → Environment Variables).`,
    );
  }
  return value.trim();
}
