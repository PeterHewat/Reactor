/** Clerk JWT template name required by `ConvexProviderWithClerk` (`getToken({ template: "convex" })`). */
export const CLERK_CONVEX_JWT_TEMPLATE_NAME = "convex";

/**
 * Claims matching Clerk's dashboard **Convex** preset (`aud` must be `convex` for `auth.config.ts`).
 *
 * @see https://docs.convex.dev/auth/clerk
 */
export const CLERK_CONVEX_JWT_CLAIMS = {
  aud: "convex",
  name: "{{user.full_name}}",
  email: "{{user.primary_email_address}}",
  picture: "{{user.image_url}}",
  nickname: "{{user.username}}",
  given_name: "{{user.first_name}}",
  family_name: "{{user.last_name}}",
} as const;

type ClerkJwtTemplateListResponse = {
  data?: Array<{ name?: string }>;
  total_count?: number;
};

type ClerkApiErrorResponse = {
  errors?: Array<{ code?: string; message?: string }>;
};

export type EnsureClerkConvexJwtTemplateResult =
  | { ok: true; created: boolean }
  | { ok: false; message: string };

function isConvexJwtTemplateName(name: string | undefined): boolean {
  return name?.trim().toLowerCase() === CLERK_CONVEX_JWT_TEMPLATE_NAME;
}

function isClerkJwtTemplateNameTakenError(body: string): boolean {
  if (/form_identifier_exists|name is taken/i.test(body)) {
    return true;
  }
  try {
    const parsed = JSON.parse(body) as ClerkApiErrorResponse;
    return (parsed.errors ?? []).some(
      (error) =>
        error.code === "form_identifier_exists" || /name is taken/i.test(error.message ?? ""),
    );
  } catch {
    return false;
  }
}

/**
 * Returns true when the Clerk instance has a JWT template named `convex`.
 *
 * @param secretKey - Clerk secret key (`sk_test_…` / `sk_live_…`)
 */
export async function hasClerkConvexJwtTemplate(secretKey: string): Promise<boolean> {
  const limit = 100;
  let offset = 0;

  while (true) {
    const url = new URL("https://api.clerk.com/v1/jwt_templates");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as ClerkJwtTemplateListResponse;
    const page = body.data ?? [];
    if (page.some((template) => isConvexJwtTemplateName(template.name))) {
      return true;
    }

    offset += page.length;
    const total = body.total_count ?? page.length;
    if (page.length === 0 || offset >= total) {
      return false;
    }
  }
}

/**
 * Ensures Clerk has the `convex` JWT template (`ConvexProviderWithClerk` / Playwright tasks E2E).
 *
 * @param secretKey - Clerk secret key (`sk_test_…` / `sk_live_…`)
 */
export async function ensureClerkConvexJwtTemplate(
  secretKey: string,
): Promise<EnsureClerkConvexJwtTemplateResult> {
  if (await hasClerkConvexJwtTemplate(secretKey)) {
    return { ok: true, created: false };
  }

  const response = await fetch("https://api.clerk.com/v1/jwt_templates", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: CLERK_CONVEX_JWT_TEMPLATE_NAME,
      claims: CLERK_CONVEX_JWT_CLAIMS,
      lifetime: 3600,
      allowed_clock_skew: 5,
      custom_signing_key: false,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    if (isClerkJwtTemplateNameTakenError(detail)) {
      return { ok: true, created: false };
    }
    return {
      ok: false,
      message: detail || `Clerk JWT template API returned ${response.status}`,
    };
  }

  return { ok: true, created: true };
}
