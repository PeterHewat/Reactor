/* eslint-disable no-console -- CLI wizard */
import { deriveHostnames } from "../../packages/config/hostnames";
import { isConvexLinked } from "./convex-link";
import { mintConvexDeployKey } from "./convex-deploy-key";
import { setConvexEnvVar } from "./convex-env";
import {
  fetchClerkFrontendApiHost,
  isClerkPublishableKey,
  isClerkSecretKey,
  normalizeClerkIssuerDomain,
} from "./clerk-instance";
import { ensureGhProductionEnvironment, ghSecretSetEnv, isGhAuthenticated } from "./gh-secrets";
import { offerOpenUrl } from "./open-url";
import {
  CLERK_API_KEYS,
  CLERK_DOMAINS,
  CONVEX_DASHBOARD,
  githubEnvironmentsUrl,
} from "./platform-urls";
import { resolveGitHubRepo } from "./apply-identity";
import { maskSecret, promptConfirm, promptLine } from "./prompt";
import { markProductionGithubSecretsSynced, type SetupConfig } from "./setup-config";
import { upsertVercelProjectEnv } from "./vercel-api";

/**
 * Interactive production stack bootstrap for `prod-*` GitHub releases.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 */
export async function bootstrapProduction(root: string, setup: SetupConfig): Promise<void> {
  const github = resolveGitHubRepo(root);
  const hostnames = deriveHostnames(setup.apexDomain);
  const firstSync = !setup.productionGithubSecretsSynced;

  console.log("\nProduction (prod-* releases)");
  console.log(
    "  Configures the GitHub **production** environment — separate from dev repository secrets.",
  );
  console.log("  Uses production Convex, Clerk, and Vercel build values for `prod-*` deploy tags.");
  console.log("  Convex dashboard:");
  await offerOpenUrl(CONVEX_DASHBOARD);
  if (github) {
    console.log("  GitHub environment:");
    await offerOpenUrl(githubEnvironmentsUrl(github));
  }

  const proceed = await promptConfirm("Configure production stack for prod-* releases?", {
    defaultYes: firstSync,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/ci-cd.md#production-environment-secrets");
    return;
  }

  if (!github) {
    console.log("○ No GitHub remote — add origin before configuring production secrets");
    return;
  }

  if (!(await isGhAuthenticated())) {
    console.log("○ GitHub CLI not authenticated — run: gh auth login");
    return;
  }

  if (!isConvexLinked(root)) {
    console.log("○ Convex not linked — run bun run dev:convex first");
    return;
  }

  if (!(await ensureGhProductionEnvironment(root, github))) {
    console.log("○ Could not create GitHub production environment — create it in the dashboard:");
    console.log(`  ${githubEnvironmentsUrl(github)}`);
    return;
  }

  console.log("\nClerk (Production instance)");
  console.log("  API keys (switch to Production):");
  await offerOpenUrl(CLERK_API_KEYS);

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

  let issuerDomain = "";
  if (clerkSk.startsWith("sk_live_")) {
    const host = await fetchClerkFrontendApiHost(clerkSk);
    if (host) {
      issuerDomain = normalizeClerkIssuerDomain(host);
      console.log(`✓ Clerk production issuer: ${issuerDomain}`);
    }
  }
  if (!issuerDomain) {
    let rawIssuer = "";
    while (!rawIssuer) {
      rawIssuer = await promptLine("Clerk Production Frontend API URL or issuer (API keys page)", {
        required: true,
      });
    }
    issuerDomain = normalizeClerkIssuerDomain(rawIssuer);
  }

  await setConvexEnvVar(root, "CLERK_JWT_ISSUER_DOMAIN", issuerDomain, true);

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
    console.log(
      "○ Could not mint production deploy key — create one in Convex Production → Deploy keys",
    );
    return;
  }

  const vercel = setup.vercel;
  const vercelTokenFromEnv = process.env.VERCEL_TOKEN?.trim();
  let vercelToken = vercelTokenFromEnv ?? "";
  if (!vercelToken) {
    vercelToken = await promptLine("VERCEL_TOKEN (for production web env vars)", {
      displayDefault: vercelTokenFromEnv ? maskSecret(vercelTokenFromEnv) : undefined,
      defaultValue: vercelTokenFromEnv,
    });
  }

  if (vercel && vercelToken) {
    try {
      await upsertVercelProjectEnv(
        vercelToken,
        vercel.orgId,
        vercel.webProjectId,
        "VITE_CONVEX_URL",
        convexUrl,
        ["production"],
      );
      await upsertVercelProjectEnv(
        vercelToken,
        vercel.orgId,
        vercel.webProjectId,
        "VITE_CLERK_PUBLISHABLE_KEY",
        clerkPk,
        ["production"],
      );
      console.log("✓ Vercel web production env vars updated");
    } catch {
      console.log("○ Could not update Vercel production env — set manually in project settings");
    }
  } else if (!vercel) {
    console.log("○ Skip Vercel production env — run the Vercel setup step first or set manually");
  }

  console.log("\nClerk allowed origins (Production instance)");
  await offerOpenUrl(CLERK_DOMAINS);
  console.log(`    • https://${hostnames.webProduction}`);

  const secrets: Array<[string, string]> = [
    ["CONVEX_DEPLOY_KEY", deployKey],
    ["VITE_CONVEX_URL", convexUrl],
    ["VITE_CLERK_PUBLISHABLE_KEY", clerkPk],
  ];

  if (vercel) {
    secrets.push(
      ["VERCEL_ORG_ID", vercel.orgId],
      ["VERCEL_WEB_PROJECT_ID", vercel.webProjectId],
      ["VERCEL_MARKETING_PROJECT_ID", vercel.marketingProjectId],
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
