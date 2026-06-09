/* eslint-disable no-console -- CLI wizard */
import { deriveHostnames } from "../../packages/config/hostnames";
import { resolveGitHubRepo } from "./apply-identity";
import {
  isClerkPublishableKey,
  isClerkSecretKey,
  issuerFromPublishableKey,
  mergeClerkAllowedOrigins,
  normalizeClerkIssuerDomain,
  resolveClerkIssuerDomain,
} from "./clerk-instance";
import { mintConvexDeployKey } from "./convex-deploy-key";
import { setConvexEnvVar } from "./convex-env";
import { isConvexLinked } from "./convex-link";
import { ensureGhProductionEnvironment, ghSecretSetEnv, isGhAuthenticated } from "./gh-secrets";
import { printManualAction } from "./manual-action";
import {
  CLERK_API_KEYS,
  CONVEX_DASHBOARD,
  VERCEL_TOKENS,
  githubEnvironmentsUrl,
} from "./platform-urls";
import { maskSecret, promptConfirm, promptLine } from "./prompt";
import { markProductionGithubSecretsSynced, type SetupConfig } from "./setup-config";
import { upsertVercelProjectEnv } from "./vercel-api";

export type BootstrapProductionOptions = {
  vercelToken?: string;
};

/**
 * Interactive production stack bootstrap for `release-*` GitHub releases.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 * @param options - Optional Vercel token from an earlier setup step
 */
export async function bootstrapProduction(
  root: string,
  setup: SetupConfig,
  options?: BootstrapProductionOptions,
): Promise<void> {
  const github = resolveGitHubRepo(root);
  const hostnames = deriveHostnames(setup.apexDomain);
  const firstSync = !setup.github?.syncedSecrets?.production;

  if (!firstSync) {
    console.log("\nProduction (release-* tags)");
    console.log("✓ Production secrets already synced — skip");
    return;
  }

  console.log("\nProduction (release-* tags)");
  console.log(
    "  Configures the GitHub **production** environment — separate from dev repository secrets.",
  );
  console.log(
    "  Uses production Convex, Clerk, and Vercel build values for `release-*` deploy tags.",
  );
  console.log(`  Convex dashboard: ${CONVEX_DASHBOARD}`);
  if (github) {
    console.log(`  GitHub environment: ${githubEnvironmentsUrl(github)}`);
  }

  const proceed = await promptConfirm("Configure production stack for release-* deploys?", {
    defaultYes: firstSync,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/ci-cd.md#production-environment-secrets");
    return;
  }

  if (!github) {
    printManualAction("Add a GitHub remote", [
      "Add `origin` pointing at your GitHub repository",
      "Re-run `bun run setup` and confirm the Production step",
    ]);
    return;
  }

  if (!(await isGhAuthenticated())) {
    printManualAction("Authenticate GitHub CLI", [
      "Run `gh auth login` in a terminal",
      "Resume `bun run setup` and confirm the Production step",
    ]);
    return;
  }

  if (!isConvexLinked(root)) {
    printManualAction("Link Convex before configuring production", [
      `Convex dashboard: ${CONVEX_DASHBOARD}`,
      "Resume `bun run setup` — complete the Convex step first",
      "Then confirm the Production step",
    ]);
    return;
  }

  if (!(await ensureGhProductionEnvironment(root, github))) {
    printManualAction("Create the GitHub production environment", [
      `GitHub → Settings → Environments: ${githubEnvironmentsUrl(github)}`,
      "Create an environment named `production`, then resume setup",
    ]);
    return;
  }

  printManualAction("Copy Clerk Production API keys", [
    `Switch to Production instance: ${CLERK_API_KEYS}`,
    "Paste pk_live_… and sk_live_… when prompted below",
  ]);

  let clerkPk = "";
  while (!isClerkPublishableKey(clerkPk) || !clerkPk.startsWith("pk_live_")) {
    clerkPk = await promptLine("VITE_CLERK_PUBLISHABLE_KEY (pk_live_…)", { required: true });
    if (!clerkPk.startsWith("pk_live_")) {
      console.log("  Production releases need a live publishable key (pk_live_…).");
      clerkPk = "";
    }
  }

  const clerkSkInput = await promptLine(
    "CLERK_SECRET_KEY (sk_live_…) — optional; used to derive issuer",
    {},
  );
  const clerkSk = isClerkSecretKey(clerkSkInput) ? clerkSkInput : "";

  let issuerDomain = (await resolveClerkIssuerDomain(clerkPk, clerkSk || undefined)) ?? "";
  if (issuerDomain) {
    console.log(`✓ Clerk production issuer: ${issuerDomain}`);
  } else {
    const issuerDefault = issuerFromPublishableKey(clerkPk);
    let rawIssuer = "";
    while (!rawIssuer) {
      rawIssuer = await promptLine("Clerk Production Frontend API URL (API keys page)", {
        defaultValue: issuerDefault ?? undefined,
        required: !issuerDefault,
      });
    }
    issuerDomain = normalizeClerkIssuerDomain(rawIssuer);
  }

  await setConvexEnvVar(root, "CLERK_JWT_ISSUER_DOMAIN", issuerDomain, true);

  printManualAction("Copy Convex Production deployment URL", [
    `Convex dashboard: ${CONVEX_DASHBOARD}`,
    "Switch to your **Production** deployment → copy the URL (https://….convex.cloud)",
  ]);

  let convexUrl = "";
  while (!convexUrl.startsWith("https://") || !convexUrl.includes(".convex.cloud")) {
    convexUrl = await promptLine("VITE_CONVEX_URL (Production deployment URL)", { required: true });
    if (!convexUrl.includes(".convex.cloud")) {
      console.log("  Expected a Convex cloud URL (https://….convex.cloud).");
      convexUrl = "";
    }
  }

  const deployKey = await mintConvexDeployKey(root, "github-prod", "prod");
  if (!deployKey) {
    printManualAction("Create a Convex Production deploy key", [
      `Convex dashboard: ${CONVEX_DASHBOARD}`,
      "Production deployment → Settings → Deploy keys → create a key for GitHub CI",
      "Re-run setup or add CONVEX_DEPLOY_KEY to the GitHub production environment manually",
    ]);
    return;
  }

  const vercel = setup.vercel;
  const vercelTokenFromEnv = process.env.VERCEL_TOKEN?.trim();
  let vercelToken = options?.vercelToken?.trim() ?? vercelTokenFromEnv ?? "";
  if (!vercelToken) {
    printManualAction("Create a Vercel API token", [
      `Account → Tokens: ${VERCEL_TOKENS}`,
      "Paste the token when prompted below (updates Vercel production env vars)",
    ]);
    vercelToken = await promptLine("Paste your Vercel API token", {
      displayDefault: vercelTokenFromEnv ? maskSecret(vercelTokenFromEnv) : undefined,
      defaultValue: vercelTokenFromEnv,
    });
  }

  if (vercel?.synced && vercelToken) {
    try {
      await upsertVercelProjectEnv(
        vercelToken,
        vercel.orgId,
        vercel.projectIdWeb,
        "VITE_CONVEX_URL",
        convexUrl,
        ["production"],
      );
      await upsertVercelProjectEnv(
        vercelToken,
        vercel.orgId,
        vercel.projectIdWeb,
        "VITE_CLERK_PUBLISHABLE_KEY",
        clerkPk,
        ["production"],
      );
      console.log("✓ Vercel web production env vars updated");
    } catch {
      console.log("○ Could not update Vercel production env — set manually in project settings");
    }
  } else if (!vercel?.synced) {
    console.log("○ Skip Vercel production env — run the Vercel setup step first or set manually");
  }

  if (clerkSk.startsWith("sk_live_")) {
    console.log("\nClerk allowed origins (Production instance)");
    const prodOrigin = `https://${hostnames.webProduction}`;
    const result = await mergeClerkAllowedOrigins(clerkSk, [prodOrigin]);
    if (result.ok) {
      if (result.added.length > 0) {
        console.log(`✓ Clerk production allowed origins updated (+ ${result.added.join(", ")})`);
      } else {
        console.log(`✓ Clerk production allowed origins already include ${prodOrigin}`);
      }
    } else {
      console.log(`○ Could not update Clerk allowed origins via API: ${result.message}`);
      printManualAction("Set Clerk production allowed origins via Backend API", [
        "Use your **Production** instance secret key (sk_live_…)",
        `PATCH https://api.clerk.com/v1/instance with allowed_origins including ${prodOrigin}`,
      ]);
    }
  } else {
    printManualAction("Set Clerk production allowed origins via Backend API", [
      "Provide sk_live_… when prompted so setup can PATCH allowed_origins automatically",
      `Required origin: https://${hostnames.webProduction}`,
    ]);
  }

  const secrets: Array<[string, string]> = [
    ["CONVEX_DEPLOY_KEY", deployKey],
    ["VITE_CONVEX_URL", convexUrl],
    ["VITE_CLERK_PUBLISHABLE_KEY", clerkPk],
  ];

  if (vercel?.synced) {
    secrets.push(
      ["VERCEL_ORG_ID", vercel.orgId],
      ["VERCEL_WEB_PROJECT_ID", vercel.projectIdWeb],
      ["VERCEL_MARKETING_PROJECT_ID", vercel.projectIdMarketing],
    );
  }
  if (vercelToken) {
    secrets.push(["VERCEL_TOKEN", vercelToken]);
  }

  let okCount = 0;
  for (const [name, value] of secrets) {
    const ok = await ghSecretSetEnv(root, "production", name, value);
    console.log(ok ? `✓ production / ${name}` : `○ Failed production / ${name}`);
    if (ok) {
      okCount += 1;
    }
  }

  if (okCount >= 3) {
    markProductionGithubSecretsSynced(root);
  }
}
