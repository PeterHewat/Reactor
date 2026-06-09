import { normalizeApexDomainInput } from "./validate-domain";

/**
 * Default Playwright E2E Clerk user email derived from the product apex domain.
 *
 * @param apexDomain - Apex domain (e.g. `foobar.com`)
 * @returns Address like `e2e.test@foobar.com`
 */
export function defaultE2eClerkEmail(apexDomain: string): string {
  const apex = normalizeApexDomainInput(apexDomain);
  return `e2e.test@${apex}`;
}
