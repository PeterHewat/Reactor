import { parseDotenvAssignmentValue } from "./env-placeholders";
import { hasApexDomain, normalizeApexDomainInput } from "./validate-domain";

/** Fallback E2E address when no apex domain is configured yet. */
export const E2E_CLERK_EMAIL_WITHOUT_APEX = "e2e.test@example.com";

const E2E_EMAIL_TEMPLATE_PATTERN = /your-apex-domain/i;

/**
 * Returns true when an E2E Clerk user email is unset or still a template placeholder.
 * Unlike {@link isPlaceholderEnvValue}, accepts {@link E2E_CLERK_EMAIL_WITHOUT_APEX}
 * after setup creates that Clerk user.
 *
 * @param value - Raw env value (may include quotes)
 */
export function isPlaceholderE2EClerkEmail(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  const trimmed = parseDotenvAssignmentValue(value);
  if (!trimmed) {
    return true;
  }
  if (trimmed === E2E_CLERK_EMAIL_WITHOUT_APEX) {
    return false;
  }
  return E2E_EMAIL_TEMPLATE_PATTERN.test(trimmed);
}

/**
 * Default Playwright E2E Clerk user email derived from the product apex domain.
 *
 * @param apexDomain - Apex domain (e.g. `foobar.com`), if configured
 * @returns Address like `e2e.test@foobar.com`, or a generic fallback when no apex
 */
export function defaultE2eClerkEmail(apexDomain?: string | null): string {
  if (!hasApexDomain(apexDomain)) {
    return E2E_CLERK_EMAIL_WITHOUT_APEX;
  }
  const apex = normalizeApexDomainInput(apexDomain!);
  return `e2e.test@${apex}`;
}
