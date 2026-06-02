/** Matches template placeholder values in env files (not real deployments or keys). */
const PLACEHOLDER_PATTERN =
  /your-project|your-project-name|your-key|your-clerk|ci-placeholder|YOUR_ORG|YOUR_REPO|your-org|your-repo|pk_test_your|sk_test_your/i;

/**
 * Returns true when an env value is empty or still a template placeholder.
 *
 * @param value - Raw env value (may include quotes)
 */
export function isPlaceholderEnvValue(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) {
    return true;
  }
  return PLACEHOLDER_PATTERN.test(trimmed);
}

/**
 * Returns true when `CONVEX_DEPLOYMENT` looks like a real linked deployment slug.
 *
 * @param value - Value from `.env.local` (e.g. `dev:happy-animal-123`)
 */
export function isRealConvexDeployment(value: string | undefined): boolean {
  if (isPlaceholderEnvValue(value)) {
    return false;
  }
  const trimmed = value!.trim().replace(/^["']|["']$/g, "");
  return /^dev:[a-z0-9-]+$/i.test(trimmed) || /^prod:[a-z0-9-]+$/i.test(trimmed);
}
