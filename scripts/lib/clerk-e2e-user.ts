import { randomBytes } from "node:crypto";

/**
 * Generates a random password suitable for Clerk user creation (≥ 8 chars).
 */
export function generateClerkE2ePassword(): string {
  return randomBytes(24).toString("base64url");
}

type ClerkUserListResponse = {
  data?: Array<{ id: string }>;
};

type EnsureClerkE2eUserResult =
  | { status: "exists" }
  | { status: "created"; password: string }
  | { status: "failed"; message: string };

/**
 * Returns whether a Clerk user-create error means the E2E email is already registered.
 *
 * @param message - Error text from the Clerk Backend API
 */
export function isClerkE2eUserAlreadyExistsMessage(message: string): boolean {
  return /email address is taken|already exists|already been taken/i.test(message);
}

/**
 * Returns whether Clerk rejected user creation because Email + Password is disabled.
 *
 * @param message - Error text from the Clerk Backend API
 */
export function isClerkEmailPasswordDisabledMessage(message: string): boolean {
  return /password|strategy|identifier|not enabled|unsupported/i.test(message);
}

/**
 * Finds a Clerk user by email via the Backend API.
 *
 * @param secretKey - Clerk secret key (`sk_test_` or `sk_live_`)
 * @param email - Email address to look up
 */
async function findClerkUserByEmail(secretKey: string, email: string): Promise<boolean> {
  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.append("email_address", email);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) {
    return false;
  }

  const body = (await response.json()) as ClerkUserListResponse;
  return (body.data?.length ?? 0) > 0;
}

/**
 * Creates a Clerk user with email + password via the Backend API.
 *
 * @param secretKey - Clerk secret key
 * @param email - Email address for the new user
 * @param password - Plaintext password (Clerk enforces strength rules)
 */
async function createClerkUser(
  secretKey: string,
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [email],
      password,
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  let detail = `HTTP ${response.status}`;
  try {
    const body = (await response.json()) as { errors?: Array<{ message?: string }> };
    const messages = body.errors?.map((e) => e.message).filter(Boolean);
    if (messages?.length) {
      detail = messages.join("; ");
    }
  } catch {
    // ignore JSON parse errors
  }

  return { ok: false, message: detail };
}

/**
 * Ensures a dev Clerk user exists for Playwright E2E (idempotent).
 *
 * Playwright signs in via `@clerk/testing` ticket tokens — the password is only
 * for optional manual dashboard sign-in.
 *
 * @param secretKey - Clerk development secret key (`sk_test_…`)
 * @param email - E2E user email address
 */
export async function ensureClerkE2eUser(
  secretKey: string,
  email: string,
): Promise<EnsureClerkE2eUserResult> {
  if (!secretKey.startsWith("sk_test_")) {
    return { status: "failed", message: "E2E user provisioning requires a development secret key" };
  }

  if (await findClerkUserByEmail(secretKey, email)) {
    return { status: "exists" };
  }

  const password = generateClerkE2ePassword();
  const created = await createClerkUser(secretKey, email, password);
  if (!created.ok) {
    if (isClerkE2eUserAlreadyExistsMessage(created.message)) {
      return { status: "exists" };
    }
    return { status: "failed", message: created.message };
  }

  return { status: "created", password };
}
