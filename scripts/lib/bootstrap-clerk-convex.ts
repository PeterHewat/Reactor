/* eslint-disable no-console -- CLI wizard */
import { defaultE2eClerkEmail } from "../../packages/config/e2e-clerk";
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { deriveHostnames } from "../../packages/config/hostnames";
import { ensureClerkE2eUser } from "./clerk-e2e-user";
import {
  isClerkPublishableKey,
  isClerkSecretKey,
  issuerFromPublishableKey,
  mergeClerkAllowedOrigins,
  normalizeClerkIssuerDomain,
  resolveClerkIssuerDomain,
} from "./clerk-instance";
import { isConvexLinked } from "./convex-link";
import { readEnvFile, upsertEnvKeys } from "./env-file";
import { ensureConvexLinkedInteractive, pushConvexDevOnce } from "./link-convex";
import { syncClerkConvexFromWebEnv } from "./sync-clerk-convex";
import { normalizeEnvPaste } from "./env-paste";
import { printManualAction } from "./manual-action";
import {
  CLERK_API_KEYS,
  CLERK_CREATE_APP,
  CLERK_DASHBOARD,
  CONVEX_DASHBOARD,
} from "./platform-urls";
import { maskSecret, promptLine } from "./prompt";
import type { SetupConfig } from "./setup-config";

const WEB_ENV = "apps/web/.env.local";

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
  printManualAction("Enable Clerk Email + Password (Development)", [
    `Clerk dashboard: ${CLERK_DASHBOARD}`,
    "Configure → User & authentication → enable **Email** and **Password**",
    "Setup creates the E2E user via API when missing; Playwright signs in without the password",
  ]);

  let email = (existingEmail ?? defaultEmail).trim();
  let result = await ensureClerkE2eUser(secretKey, email);

  if (result.status === "failed") {
    console.log(`○ Could not create E2E user ${email}: ${result.message}`);
    email = (
      await promptLine("E2E_CLERK_USER_EMAIL", {
        defaultValue: email,
        required: true,
      })
    ).trim();
    result = await ensureClerkE2eUser(secretKey, email);
  }

  if (result.status === "exists") {
    console.log(`✓ E2E user ${email} already exists in Clerk`);
  } else if (result.status === "created") {
    console.log(`✓ Created E2E user ${email} in Clerk`);
    console.log(
      "  Playwright signs in via @clerk/testing — password is not stored in apps/web/.env.local",
    );
  } else {
    console.log(`○ Could not create E2E user: ${result.message}`);
    printManualAction("Fix Clerk E2E user setup", [
      `Clerk dashboard: ${CLERK_DASHBOARD}`,
      "Enable **Email** and **Password** (Development), then resume setup",
      "Or create the user manually in the Clerk dashboard",
    ]);
  }

  upsertEnvKeys(root, WEB_ENV, { E2E_CLERK_USER_EMAIL: email });
  console.log(`✓ Set E2E_CLERK_USER_EMAIL → ${email}`);
}

/**
 * Applies Clerk keys already present in `apps/web/.env.local` (no prompts).
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 * @param publishableKey - Clerk publishable key
 * @param secretKey - Clerk secret key
 */
async function applyClerkKeysFromEnv(
  root: string,
  setup: SetupConfig,
  publishableKey: string,
  secretKey: string,
): Promise<string | null> {
  console.log("\nClerk");
  console.log(`✓ Using keys from ${WEB_ENV} (pk ${maskSecret(publishableKey)})`);

  let issuerDomain = await resolveClerkIssuerDomain(publishableKey, secretKey);
  if (issuerDomain) {
    console.log(`✓ Clerk issuer: ${issuerDomain}`);
  } else {
    const fromPk = issuerFromPublishableKey(publishableKey);
    if (fromPk) {
      issuerDomain = fromPk;
      console.log(`✓ Clerk issuer: ${issuerDomain}`);
    }
  }

  const webEnv = readEnvFile(root, WEB_ENV);
  await provisionE2eClerkUser(root, setup, secretKey, webEnv);

  if (secretKey.startsWith("sk_test_")) {
    await syncClerkDevOrigins(secretKey, setup);
  }

  return issuerDomain;
}

/**
 * Returns Clerk keys from env when both are set and valid.
 *
 * @param root - Repository root
 */
function readValidClerkKeysFromEnv(root: string): {
  publishableKey: string;
  secretKey: string;
} | null {
  const webEnv = readEnvFile(root, WEB_ENV);
  const publishableKey = webEnv.VITE_CLERK_PUBLISHABLE_KEY;
  const secretKey = webEnv.CLERK_SECRET_KEY;
  if (
    isPlaceholderEnvValue(publishableKey) ||
    isPlaceholderEnvValue(secretKey) ||
    !isClerkPublishableKey(publishableKey!) ||
    !isClerkSecretKey(secretKey!)
  ) {
    return null;
  }
  return { publishableKey: publishableKey!, secretKey: secretKey! };
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
  printManualAction("Create Clerk app and copy Development keys", [
    `Create an application (if needed): ${CLERK_CREATE_APP}`,
    `API keys — select **React**, copy Development keys: ${CLERK_API_KEYS}`,
  ]);

  let publishableKey = "";
  while (!isClerkPublishableKey(publishableKey)) {
    const rawPk = await promptLine("VITE_CLERK_PUBLISHABLE_KEY (pk_test_…)", {
      defaultValue: existingPk,
      displayDefault: existingPk ? maskSecret(existingPk) : undefined,
      required: !existingPk,
    });
    publishableKey = normalizeEnvPaste("VITE_CLERK_PUBLISHABLE_KEY", rawPk);
    if (!isClerkPublishableKey(publishableKey)) {
      console.log("  Expected a Clerk publishable key (pk_test_… or pk_live_…).");
      publishableKey = "";
    }
  }

  const rawSk = await promptLine(
    "CLERK_SECRET_KEY (sk_test_…) — copy from **Secret keys** on the same page",
    {
      defaultValue: existingSk,
      displayDefault: existingSk ? maskSecret(existingSk) : undefined,
    },
  );
  const secretKey = normalizeEnvPaste("CLERK_SECRET_KEY", rawSk);
  const resolvedSecret = isClerkSecretKey(secretKey) ? secretKey : "";

  let issuerDomain = await resolveClerkIssuerDomain(publishableKey, resolvedSecret || undefined);
  if (issuerDomain) {
    console.log(`✓ Clerk issuer: ${issuerDomain}`);
  } else {
    const issuerDefault = issuerFromPublishableKey(publishableKey);
    let rawIssuer = "";
    while (!rawIssuer) {
      rawIssuer = await promptLine(
        "Clerk Frontend API URL (API keys page, e.g. https://….clerk.accounts.dev)",
        {
          defaultValue: issuerDefault ?? undefined,
          required: !issuerDefault,
        },
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

  if (resolvedSecret.startsWith("sk_test_")) {
    await syncClerkDevOrigins(resolvedSecret, setup);
  } else {
    printManualAction("Add CLERK_SECRET_KEY for allowed-origin sync", [
      "Paste sk_test_… when prompted on a future setup run",
      "Setup will PATCH allowed origins via the Clerk Backend API automatically",
    ]);
  }

  return issuerDomain;
}

/**
 * Ensures Development-instance allowed origins include localhost and preview staging.
 *
 * @param secretKey - Clerk development secret key
 * @param setup - Persisted setup config
 */
async function syncClerkDevOrigins(secretKey: string, setup: SetupConfig): Promise<void> {
  const hostnames = deriveHostnames(setup.apexDomain);
  console.log("\nClerk allowed origins (Development instance)");

  const result = await mergeClerkAllowedOrigins(secretKey, hostnames.clerkDevOrigins, {
    developmentOrigin: "http://localhost:5173",
  });

  if (result.ok) {
    if (result.added.length > 0) {
      console.log(`✓ Clerk allowed origins updated (+ ${result.added.join(", ")})`);
    } else {
      console.log(
        `✓ Clerk allowed origins already include ${hostnames.clerkDevOrigins.join(", ")}`,
      );
    }
    return;
  }

  console.log(`○ Could not update Clerk allowed origins via API: ${result.message}`);
  printManualAction("Set Clerk allowed origins via Backend API", [
    "Allowed origins are not configured on the Clerk Domains dashboard page",
    `PATCH https://api.clerk.com/v1/instance with Authorization: Bearer <CLERK_SECRET_KEY>`,
    `Body: {"allowed_origins":${JSON.stringify(hostnames.clerkDevOrigins)},"development_origin":"http://localhost:5173"}`,
    "Re-run setup after fixing the secret key, or apply the PATCH manually",
  ]);
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

  const envKeys = readValidClerkKeysFromEnv(root);

  if (envKeys) {
    issuerDomain = await applyClerkKeysFromEnv(
      root,
      setup,
      envKeys.publishableKey,
      envKeys.secretKey,
    );
  } else if (interactive) {
    issuerDomain = await promptClerkKeys(root, setup);
  } else if (!isPlaceholderEnvValue(webEnv.VITE_CLERK_PUBLISHABLE_KEY)) {
    issuerDomain = await resolveClerkIssuerDomain(
      webEnv.VITE_CLERK_PUBLISHABLE_KEY!,
      isPlaceholderEnvValue(webEnv.CLERK_SECRET_KEY) ? undefined : webEnv.CLERK_SECRET_KEY,
    );
  }

  if (!isConvexLinked(root)) {
    if (interactive) {
      await ensureConvexLinkedInteractive(root);
    } else {
      printManualAction("Link Convex to this repository", [
        `Convex dashboard: ${CONVEX_DASHBOARD}`,
        "Run `bun run setup` interactively to link Convex, or `bun run dev:convex` manually",
      ]);
      return;
    }
  }

  const sync = await syncClerkConvexFromWebEnv(root, {
    issuerDomain: issuerDomain ?? undefined,
  });

  if (interactive && sync.issuerChanged && issuerDomain) {
    await pushConvexDevOnce(root);
  } else if (sync.issuerConfigured && !sync.issuerChanged) {
    console.log("✓ Convex auth already configured — skip push");
  }
}
