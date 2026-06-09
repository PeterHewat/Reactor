/** Matches template placeholder values in env files (not real deployments or keys). */
const PLACEHOLDER_PATTERN =
  /your-project|your-project-name|your-key|your-clerk|your-apex-domain|ci-placeholder|YOUR_ORG|YOUR_REPO|your-org|your-repo|pk_test_your|sk_test_your|e2e\.test@example\.com/i;

/**
 * Normalizes the right-hand side of a dotenv `KEY=value` line (quotes, inline `#` comments).
 *
 * @param raw - Unparsed value after `=`
 * @returns Trimmed value without trailing ` # ...` comment
 *
 * @example
 * parseDotenvAssignmentValue('dev:happy-animal-123 # team: acme'); // "dev:happy-animal-123"
 */
export function parseDotenvAssignmentValue(raw: string): string {
  let value = raw.trim();
  const inlineComment = value.search(/ (?=#)/);
  if (inlineComment !== -1) {
    value = value.slice(0, inlineComment).trim();
  }
  return value.replace(/^["']|["']$/g, "");
}

/**
 * Returns true when an env value is empty or still a template placeholder.
 *
 * @param value - Raw env value (may include quotes)
 */
export function isPlaceholderEnvValue(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  const trimmed = parseDotenvAssignmentValue(value);
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
  if (value === undefined || isPlaceholderEnvValue(value)) {
    return false;
  }
  const trimmed = parseDotenvAssignmentValue(value);
  return /^dev:[a-z0-9-]+$/i.test(trimmed) || /^prod:[a-z0-9-]+$/i.test(trimmed);
}
