export type ClerkInstance = {
  frontend_api?: string;
  allowed_origins?: string[];
  development_origin?: string | null;
};

/**
 * Fetches Clerk instance settings via the Backend API (`CLERK_SECRET_KEY`).
 *
 * @param secretKey - Clerk development or production secret key
 */
export async function fetchClerkInstance(secretKey: string): Promise<ClerkInstance | null> {
  const response = await fetch("https://api.clerk.com/v1/instance", {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ClerkInstance;
}

/**
 * Fetches the Clerk Frontend API host via the Backend API (`CLERK_SECRET_KEY`).
 *
 * @param secretKey - Clerk development or production secret key
 */
export async function fetchClerkFrontendApiHost(secretKey: string): Promise<string | null> {
  const instance = await fetchClerkInstance(secretKey);
  const host = instance?.frontend_api?.trim();
  return host || null;
}

/**
 * Derives the Clerk JWT issuer from a publishable key (base64-encoded Frontend API host).
 *
 * @param publishableKey - Clerk publishable key (`pk_test_…` / `pk_live_…`)
 */
export function issuerFromPublishableKey(publishableKey: string): string | null {
  const match = publishableKey.trim().match(/^pk_(?:test|live)_(.+)$/);
  if (!match?.[1]) {
    return null;
  }
  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8").replace(/\$$/, "");
    if (!decoded.includes(".clerk.accounts.")) {
      return null;
    }
    return normalizeClerkIssuerDomain(decoded);
  } catch {
    return null;
  }
}

/**
 * Resolves Clerk JWT issuer from secret key (API) or publishable key (local decode).
 *
 * @param publishableKey - Clerk publishable key
 * @param secretKey - Optional Clerk secret key
 */
export async function resolveClerkIssuerDomain(
  publishableKey: string,
  secretKey?: string,
): Promise<string | null> {
  if (secretKey) {
    const host = await fetchClerkFrontendApiHost(secretKey);
    if (host) {
      return normalizeClerkIssuerDomain(host);
    }
  }
  return issuerFromPublishableKey(publishableKey);
}

/**
 * Merges origins into Clerk `allowed_origins` (and optionally sets `development_origin`).
 *
 * @param secretKey - Clerk secret key for the target instance
 * @param origins - Origins to ensure are allowed
 * @param options - Optional `development_origin` (e.g. `http://localhost:5173`)
 */
export async function mergeClerkAllowedOrigins(
  secretKey: string,
  origins: string[],
  options?: { developmentOrigin?: string },
): Promise<{ ok: true; added: string[] } | { ok: false; message: string }> {
  const instance = await fetchClerkInstance(secretKey);
  if (!instance) {
    return { ok: false, message: "Could not read Clerk instance — check CLERK_SECRET_KEY" };
  }

  const existing = new Set(instance.allowed_origins ?? []);
  const added = origins.filter((origin) => !existing.has(origin));
  const merged = [...existing, ...added];

  const body: { allowed_origins: string[]; development_origin?: string } = {
    allowed_origins: merged,
  };
  if (options?.developmentOrigin) {
    body.development_origin = options.developmentOrigin;
  }

  const response = await fetch("https://api.clerk.com/v1/instance", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, message: text.slice(0, 200) };
  }

  return { ok: true, added };
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
