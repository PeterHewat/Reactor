/**
 * Fetches the Clerk Frontend API host via the Backend API (`CLERK_SECRET_KEY`).
 *
 * @param secretKey - Clerk development or production secret key
 */
export async function fetchClerkFrontendApiHost(secretKey: string): Promise<string | null> {
  const response = await fetch("https://api.clerk.com/v1/instance", {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { frontend_api?: string };
  const host = body.frontend_api?.trim();
  return host || null;
}

/**
 * Normalizes a Clerk JWT issuer domain URL for Convex (`https://….clerk.accounts.dev`).
 *
 * @param input - Frontend API host or full issuer URL
 */
export function normalizeClerkIssuerDomain(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed.replace(/\/$/, "")}`;
}

/**
 * Returns true when a string looks like a Clerk publishable key.
 *
 * @param value - Candidate publishable key
 */
export function isClerkPublishableKey(value: string): boolean {
  return /^pk_(test|live)_[a-zA-Z0-9]+$/.test(value.trim());
}

/**
 * Returns true when a string looks like a Clerk secret key.
 *
 * @param value - Candidate secret key
 */
export function isClerkSecretKey(value: string): boolean {
  return /^sk_(test|live)_[a-zA-Z0-9]+$/.test(value.trim());
}
