/* eslint-disable no-console -- CLI wizard */
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { mintConvexDeployKey } from "./convex-deploy-key";
import { isConvexLinked } from "./convex-link";
import { readEnvFile } from "./env-file";
import { ghSecretSet, isGhAuthenticated } from "./gh-secrets";
import { githubEnvironmentsUrl, githubSecretsUrl } from "./platform-urls";
import { offerOpenUrl } from "./open-url";
import { promptConfirm } from "./prompt";
import { resolveGitHubRepo } from "./apply-identity";
import { markGithubSecretsSynced, type SetupConfig } from "./setup-config";

const WEB_ENV = "apps/web/.env.local";

/**
 * Pushes dev-stack repository secrets to GitHub when the user confirms.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config (controls default yes/no)
 */
export async function bootstrapCiSecrets(root: string, setup: SetupConfig): Promise<void> {
  const github = resolveGitHubRepo(root);
  const firstSync = !setup.githubSecretsSynced;

  console.log("\nGitHub Actions");
  console.log(
    "  Sync dev-stack repository secrets so PR CI and E2E can run (development Convex + Clerk only).",
  );
  console.log("  Uses `gh secret set` — run `gh auth login` first if needed.");
  console.log(
    "  Includes a newly minted CONVEX_DEPLOY_KEY (CI codegen); existing GitHub key is replaced.",
  );
  if (github) {
    console.log("  Manual fallback:");
    await offerOpenUrl(githubSecretsUrl(github));
  }

  const proceed = await promptConfirm("Sync dev CI secrets to GitHub?", {
    defaultYes: firstSync,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/ci-cd.md#repository-secrets");
    return;
  }

  if (!(await isGhAuthenticated())) {
    console.log("○ GitHub CLI not authenticated — run: gh auth login");
    if (github) {
      console.log(`  Secrets: ${githubSecretsUrl(github)}`);
      console.log(`  Environments: ${githubEnvironmentsUrl(github)}`);
    }
    return;
  }

  if (!isConvexLinked(root)) {
    console.log("○ Convex not linked — run bun run dev:convex first");
    return;
  }

  const webEnv = readEnvFile(root, WEB_ENV);
  const deployKey = await mintConvexDeployKey(root, "github-ci", "dev");
  let deployKeyOk = false;
  if (deployKey) {
    deployKeyOk = await ghSecretSet(root, "CONVEX_DEPLOY_KEY", deployKey);
    console.log(deployKeyOk ? "✓ CONVEX_DEPLOY_KEY" : "○ Failed to set CONVEX_DEPLOY_KEY");
  }

  const pairs: Array<[string, string | undefined]> = [
    ["VITE_CONVEX_URL", webEnv.VITE_CONVEX_URL],
    ["VITE_CLERK_PUBLISHABLE_KEY", webEnv.VITE_CLERK_PUBLISHABLE_KEY],
    ["CLERK_SECRET_KEY", webEnv.CLERK_SECRET_KEY],
    ["E2E_CLERK_USER_EMAIL", webEnv.E2E_CLERK_USER_EMAIL],
  ];

  for (const [name, value] of pairs) {
    if (!value || isPlaceholderEnvValue(value)) {
      console.log(`○ Skip ${name} — not set in ${WEB_ENV}`);
      continue;
    }
    const ok = await ghSecretSet(root, name, value);
    console.log(ok ? `✓ ${name}` : `○ Failed to set ${name}`);
  }

  if (deployKeyOk) {
    markGithubSecretsSynced(root);
  }
}
