import { hasApexDomain, normalizeApexDomainInput } from "./validate-domain";

/** Fallback E2E address when no apex domain is configured yet. */
export const E2E_CLERK_EMAIL_WITHOUT_APEX = "e2e.test@example.com";

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
