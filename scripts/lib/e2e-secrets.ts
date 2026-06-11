import { fetchClerkInstance, frontendApiSlugFromPublishableKey } from "./clerk-instance.ts";
import { ensureClerkConvexJwtTemplate } from "./clerk-jwt-template.ts";

export type E2ESecretsCheckResult =
  | { ok: true; jwtTemplateCreated: boolean }
  | { ok: false; message: string };

/**
 * Verifies Clerk dev keys authenticate and belong to the same instance.
 * Probes the testing-token endpoint used by `@clerk/testing` `clerkSetup()`.
 *
 * @param publishableKey - Development publishable key (`pk_test_…`)
 * @param secretKey - Development secret key (`sk_test_…`)
 */
export async function verifyClerkE2ESecrets(
  publishableKey: string,
  secretKey: string,
): Promise<E2ESecretsCheckResult> {
  const publishable = publishableKey.trim();
  const secret = secretKey.trim();

  const instance = await fetchClerkInstance(secret);
  if (!instance) {
    return {
      ok: false,
      message:
        "CLERK_SECRET_KEY was rejected by the Clerk API — re-copy the Development secret from the Clerk dashboard or re-run `bun run setup`",
    };
  }

  const publishableSlug = frontendApiSlugFromPublishableKey(publishable);
  const secretHost = instance.frontend_api?.trim();
  if (publishableSlug && secretHost && !secretHost.startsWith(`${publishableSlug}.`)) {
    return {
      ok: false,
      message:
        "VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are from different Clerk applications — sync both from the same Development instance via `bun run setup`",
    };
  }

  const tokenResponse = await fetch("https://api.clerk.com/v1/testing_tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!tokenResponse.ok) {
    return {
      ok: false,
      message: `Clerk testing token API returned ${tokenResponse.status} — use matching Development keys (pk_test_/sk_test_) from the same Clerk app. See docs/ci-cd.md#repository-secrets`,
    };
  }

  const jwtTemplate = await ensureClerkConvexJwtTemplate(secret);
  if (!jwtTemplate.ok) {
    return {
      ok: false,
      message: `Clerk JWT template "convex" is missing and could not be created (${jwtTemplate.message}) — re-sync GitHub secret CLERK_SECRET_KEY from apps/web/.env.local via \`bun run setup\`, or create the template in Clerk dashboard → JWT templates → Convex preset (docs/setup-automation.md#clerk)`,
    };
  }

  return { ok: true, jwtTemplateCreated: jwtTemplate.created };
}
