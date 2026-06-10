/** Apex domain: labels + TLD (no scheme, port, path, or `www.` prefix). */
const APEX_DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/**
 * Normalizes user input to a lowercase apex domain without a trailing dot.
 *
 * @param input - Raw domain string (may include accidental scheme or path)
 * @returns Normalized apex domain
 */
export function normalizeApexDomainInput(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/\/.*$/, "");
  value = value.replace(/:\d+$/, "");
  return value.replace(/\.$/, "");
}

/**
 * Returns whether `input` is a valid apex domain (e.g. `example.com`).
 *
 * @param input - Domain string to validate
 */
export function isValidApexDomain(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.includes("://") || trimmed.includes("/")) {
    return false;
  }
  const normalized = normalizeApexDomainInput(trimmed);
  if (!normalized || normalized.startsWith("www.") || normalized === "localhost") {
    return false;
  }
  return APEX_DOMAIN.test(normalized);
}

/**
 * Returns whether setup has a configured apex domain (optional during early setup).
 *
 * @param apexDomain - Apex domain from `.reactor/setup.json`, if any
 */
export function hasApexDomain(apexDomain?: string | null): boolean {
  return Boolean(apexDomain && isValidApexDomain(apexDomain));
}
