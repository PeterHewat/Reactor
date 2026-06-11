/* eslint-disable no-console -- CLI wizard */
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { resolveGitHubRepo } from "./apply-identity";
import { resolveDevConvexDeployKey } from "./convex-deploy-key";
import { isConvexLinked } from "./convex-link";
import { readEnvFile } from "./env-file";
import { ghSecretSet, isGhAuthenticated } from "./gh-secrets";
import { printManualAction } from "./manual-action";
import { canAutomateGh, type SetupCliContext } from "./setup-cli";
import { githubEnvironmentsUrl, githubSecretsUrl } from "./platform-urls";
import { promptConfirm } from "./prompt";
import { markGithubSecretsSynced, type SetupConfig } from "./setup-config";

const WEB_ENV = "apps/web/.env.local";

/**
 * Pushes dev-stack repository secrets to GitHub when the user confirms.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config (controls default yes/no)
 * @param cliContext - CLI readiness from the prerequisites step
 */
export async function bootstrapCiSecrets(
  root: string,
  setup: SetupConfig,
  cliContext?: SetupCliContext,
): Promise<void> {
  const github = resolveGitHubRepo(root);
  const firstSync = !setup.github?.syncedSecrets?.repo;

  if (!firstSync) {
    console.log("\nGitHub Actions");
    console.log("✓ Dev CI secrets already synced — skip");
    return;
  }

  const ghReady = cliContext ? canAutomateGh(cliContext) : await isGhAuthenticated();

  console.log("\nGitHub Actions");
  console.log(
    "  Syncs dev-stack **repository** secrets via `gh secret set` so PR CI and E2E can run (development Convex + Clerk only).",
  );
  console.log(
    "  Automatic when you answer yes below and `gh auth login` is done — no manual paste in GitHub UI.",
  );
  console.log(
    "  Includes a newly minted CONVEX_DEPLOY_KEY (CI codegen); existing GitHub key is replaced.",
  );
  if (github) {
    console.log(`  Manual fallback (if sync fails or you skip): ${githubSecretsUrl(github)}`);
  }

  const proceed = await promptConfirm("Sync dev CI secrets to GitHub?", {
    defaultYes: firstSync && ghReady,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/ci-cd.md#repository-secrets");
    return;
  }

  if (!ghReady) {
    if (github) {
      console.log(`  Manual fallback: ${githubSecretsUrl(github)}`);
      console.log(`  Environments: ${githubEnvironmentsUrl(github)}`);
    }
    printManualAction("Install and authenticate GitHub CLI", [
      "Install from https://cli.github.com/ (macOS: `brew install gh`)",
      "Run `gh auth login`",
      "Resume `bun run setup` and confirm the GitHub Actions sync step",
    ]);
    return;
  }

  if (!isConvexLinked(root)) {
    printManualAction("Link Convex before syncing CI secrets", [
      "Resume `bun run setup` — the Convex step links the project and sets CLERK_JWT_ISSUER_DOMAIN",
      "Then confirm the GitHub Actions sync step",
    ]);
    return;
  }

  const webEnv = readEnvFile(root, WEB_ENV);
  const deployKey = await resolveDevConvexDeployKey(root, "github-ci");
  if (!deployKey) {
    printManualAction("Mint CONVEX_DEPLOY_KEY for CI", [
      "Resume `bun run setup` — complete the Convex step first",
      "Then confirm the GitHub Actions sync step",
    ]);
    return;
  }

  const deployKeyOk = await ghSecretSet(root, "CONVEX_DEPLOY_KEY", deployKey);
  console.log(deployKeyOk ? "✓ CONVEX_DEPLOY_KEY" : "○ Failed to set CONVEX_DEPLOY_KEY");

  const pairs: Array<[string, string | undefined]> = [
    ["VITE_CONVEX_URL", webEnv.VITE_CONVEX_URL],
    ["VITE_CLERK_PUBLISHABLE_KEY", webEnv.VITE_CLERK_PUBLISHABLE_KEY],
    ["CLERK_SECRET_KEY", webEnv.CLERK_SECRET_KEY],
    ["E2E_CLERK_USER_EMAIL", webEnv.E2E_CLERK_USER_EMAIL],
  ];

  let allEnvSecretsOk = true;
  for (const [name, value] of pairs) {
    if (!value || isPlaceholderEnvValue(value)) {
      console.log(`○ Skip ${name} — not set in ${WEB_ENV}`);
      continue;
    }
    const ok = await ghSecretSet(root, name, value);
    console.log(ok ? `✓ ${name}` : `○ Failed to set ${name}`);
    if (!ok) {
      allEnvSecretsOk = false;
    }
  }

  if (deployKeyOk && allEnvSecretsOk) {
    markGithubSecretsSynced(root);
  } else if (!allEnvSecretsOk) {
    console.log("○ repo secrets not marked synced — fix failures above and resume setup");
  }
}
