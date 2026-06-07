/* eslint-disable no-console -- CLI wizard */
import { defaultE2eClerkEmail } from "../../packages/config/e2e-clerk";
import { deriveHostnames } from "../../packages/config/hostnames";
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { ensureClerkE2eUser } from "./clerk-e2e-user";
import { isConvexLinked } from "./convex-link";
import {
  fetchClerkFrontendApiHost,
  isClerkPublishableKey,
  isClerkSecretKey,
  normalizeClerkIssuerDomain,
} from "./clerk-instance";
import { setConvexEnvVar } from "./convex-env";
import { readConvexUrlFromRootEnv } from "./convex-url";
import { readEnvFile, upsertEnvKeys } from "./env-file";
import { offerOpenUrl } from "./open-url";
import { CLERK_API_KEYS, CLERK_CREATE_APP, CLERK_DOMAINS, CONVEX_DASHBOARD } from "./platform-urls";
import { maskSecret, promptLine } from "./prompt";
import type { SetupConfig } from "./setup-config";

const WEB_ENV = "apps/web/.env.local";

/**
 * Resolves Clerk issuer from an existing secret key, if possible.
 *
 * @param secretKey - Clerk secret key from env
 */
async function issuerFromSecretKey(secretKey: string): Promise<string | null> {
  if (!isClerkSecretKey(secretKey)) {
    return null;
  }
  const host = await fetchClerkFrontendApiHost(secretKey);
  return host ? normalizeClerkIssuerDomain(host) : null;
}

/**
 * Provisions the Playwright E2E Clerk user and writes email (and password when new) to web env.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 * @param secretKey - Clerk development secret key
 * @param webEnv - Current web env file contents
 */
async function provisionE2eClerkUser(
  root: string,
  setup: SetupConfig,
  secretKey: string,
  webEnv: Record<string, string>,
): Promise<void> {
  if (!secretKey.startsWith("sk_test_")) {
    return;
  }

  const defaultEmail = defaultE2eClerkEmail(setup.apexDomain);
  const existingEmail = isPlaceholderEnvValue(webEnv.E2E_CLERK_USER_EMAIL)
    ? undefined
    : webEnv.E2E_CLERK_USER_EMAIL;

  console.log("\nClerk E2E test user");
  console.log(
    "  Enable **Email** and **Password** in Clerk → User & authentication (Development).",
  );
  console.log(
    "  Setup creates the user via API when missing; Playwright signs in without the password.",
  );

  const email = await promptLine("E2E_CLERK_USER_EMAIL", {
    defaultValue: existingEmail ?? defaultEmail,
    required: true,
  });

  const result = await ensureClerkE2eUser(secretKey, email.trim());
  const envUpdates: Record<string, string> = { E2E_CLERK_USER_EMAIL: email.trim() };

  if (result.status === "exists") {
    console.log(`✓ E2E user ${email} already exists in Clerk`);
  } else if (result.status === "created") {
    envUpdates.E2E_CLERK_USER_PASSWORD = result.password;
    console.log(`✓ Created E2E user ${email} in Clerk`);
    console.log(`✓ Set E2E_CLERK_USER_PASSWORD in ${WEB_ENV} (manual sign-in only)`);
  } else {
    console.log(`○ Could not create E2E user: ${result.message}`);
    console.log(
      "  Enable Email + Password in Clerk, then re-run setup or create the user in the dashboard.",
    );
  }

  upsertEnvKeys(root, WEB_ENV, envUpdates);
  console.log(`✓ Set E2E_CLERK_USER_EMAIL → ${email.trim()}`);
}

/**
 * Interactive Clerk key collection and env file updates (prefilled from `.env.local`).
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 */
async function promptClerkKeys(root: string, setup: SetupConfig): Promise<string | null> {
  const webEnv = readEnvFile(root, WEB_ENV);
  const existingPk = isPlaceholderEnvValue(webEnv.VITE_CLERK_PUBLISHABLE_KEY)
    ? undefined
    : webEnv.VITE_CLERK_PUBLISHABLE_KEY;
  const existingSk = isPlaceholderEnvValue(webEnv.CLERK_SECRET_KEY)
    ? undefined
    : webEnv.CLERK_SECRET_KEY;

  console.log("\nClerk");
  console.log("  Create a Clerk application (if you have not already):");
  await offerOpenUrl(CLERK_CREATE_APP);
  console.log("  Then open API keys and copy your Development keys:");
  await offerOpenUrl(CLERK_API_KEYS);

  let publishableKey = "";
  while (!isClerkPublishableKey(publishableKey)) {
    publishableKey = await promptLine("VITE_CLERK_PUBLISHABLE_KEY (pk_test_…)", {
      defaultValue: existingPk,
      displayDefault: existingPk ? maskSecret(existingPk) : undefined,
      required: !existingPk,
    });
    if (!isClerkPublishableKey(publishableKey)) {
      console.log("  Expected a Clerk publishable key (pk_test_… or pk_live_…).");
      publishableKey = "";
    }
  }

  const secretKey = await promptLine(
    "CLERK_SECRET_KEY (sk_test_…) — optional for UI; required for E2E",
    {
      defaultValue: existingSk,
      displayDefault: existingSk ? maskSecret(existingSk) : undefined,
    },
  );
  const resolvedSecret = isClerkSecretKey(secretKey) ? secretKey : "";

  let issuerDomain: string | null = null;
  if (resolvedSecret) {
    issuerDomain = await issuerFromSecretKey(resolvedSecret);
    if (issuerDomain) {
      console.log(`✓ Clerk issuer: ${issuerDomain}`);
    }
  }
  if (!issuerDomain) {
    let rawIssuer = "";
    while (!rawIssuer) {
      rawIssuer = await promptLine(
        "Clerk Frontend API URL or issuer (API keys page, e.g. https://….clerk.accounts.dev)",
        { required: true },
      );
    }
    issuerDomain = normalizeClerkIssuerDomain(rawIssuer);
  }

  const toWrite: Record<string, string> = {
    VITE_CLERK_PUBLISHABLE_KEY: publishableKey,
  };
  if (resolvedSecret) {
    toWrite.CLERK_SECRET_KEY = resolvedSecret;
  }
  upsertEnvKeys(root, WEB_ENV, toWrite);
  console.log(`✓ Updated ${WEB_ENV} (pk ${maskSecret(publishableKey)})`);

  if (resolvedSecret) {
    await provisionE2eClerkUser(root, setup, resolvedSecret, {
      ...webEnv,
      ...toWrite,
    });
  }

  const hostnames = deriveHostnames(setup.apexDomain);
  console.log("\nClerk allowed origins (Development instance)");
  console.log("  Configure at:");
  await offerOpenUrl(CLERK_DOMAINS);
  for (const origin of hostnames.clerkDevOrigins) {
    console.log(`    • ${origin}`);
  }

  return issuerDomain;
}

/**
 * Guides Clerk setup, writes web env keys, and wires Convex when linked.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 * @param interactive - When true, prompt for Clerk keys (prefilled from env)
 */
export async function bootstrapClerkConvex(
  root: string,
  setup: SetupConfig,
  interactive: boolean,
): Promise<void> {
  const webEnv = readEnvFile(root, WEB_ENV);

  let issuerDomain: string | null = null;

  if (interactive) {
    issuerDomain = await promptClerkKeys(root, setup);
  } else if (!isPlaceholderEnvValue(webEnv.CLERK_SECRET_KEY)) {
    issuerDomain = await issuerFromSecretKey(webEnv.CLERK_SECRET_KEY!);
  }

  const convexLinked = isConvexLinked(root);
  if (!convexLinked) {
    console.log("\nConvex");
    console.log("  Link your Convex project (first run opens browser login):");
    console.log("  bun run dev:convex");
    console.log("  Dashboard:");
    await offerOpenUrl(CONVEX_DASHBOARD);
    return;
  }

  const convexUrl = readConvexUrlFromRootEnv(root);
  if (convexUrl) {
    const currentUrl = readEnvFile(root, WEB_ENV).VITE_CONVEX_URL;
    if (isPlaceholderEnvValue(currentUrl) || currentUrl !== convexUrl) {
      upsertEnvKeys(root, WEB_ENV, { VITE_CONVEX_URL: convexUrl });
      console.log(`✓ Set VITE_CONVEX_URL → ${convexUrl}`);
    }
  }

  if (issuerDomain) {
    const ok = await setConvexEnvVar(root, "CLERK_JWT_ISSUER_DOMAIN", issuerDomain, false);
    if (ok) {
      console.log("✓ Convex CLERK_JWT_ISSUER_DOMAIN set on dev deployment");
    }
  }
}
