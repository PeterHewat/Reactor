/* eslint-disable no-console -- CLI wizard */
import { isPlaceholderE2EClerkEmail } from "../../packages/config/e2e-clerk";
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { resolveGitHubRepo } from "./apply-identity";
import { resolveDevConvexDeployKey } from "./convex-deploy-key";
import { isConvexLinked } from "./convex-link";
import { readEnvFile } from "./env-file";
import { ghSecretSet, isGhAuthenticated, listGhRepoSecrets } from "./gh-secrets";
import { printManualAction } from "./manual-action";
import { canAutomateGh, type SetupCliContext } from "./setup-cli";
import { githubEnvironmentsUrl, githubSecretsUrl } from "./platform-urls";
import { promptConfirm } from "./prompt";
import { markGithubSecretsSynced, type SetupConfig } from "./setup-config";

const WEB_ENV = "apps/web/.env.local";

const REPO_ENV_SECRETS = [
  "VITE_CONVEX_URL",
  "VITE_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "E2E_CLERK_USER_EMAIL",
] as const;

type RepoEnvSecret = (typeof REPO_ENV_SECRETS)[number];

function isLocalRepoSecretReady(name: RepoEnvSecret, value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  if (name === "E2E_CLERK_USER_EMAIL") {
    return !isPlaceholderE2EClerkEmail(value);
  }
  return !isPlaceholderEnvValue(value);
}

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
  const webEnv = readEnvFile(root, WEB_ENV);
  const remoteSecrets = new Set(await listGhRepoSecrets(root));
  const missingOnGitHub = REPO_ENV_SECRETS.filter(
    (name) => isLocalRepoSecretReady(name, webEnv[name]) && !remoteSecrets.has(name),
  );
  const needsDeployKey = !remoteSecrets.has("CONVEX_DEPLOY_KEY");
  const firstSync = !setup.github?.syncedSecrets?.repo;
  const needsSync = firstSync || needsDeployKey || missingOnGitHub.length > 0;

  if (!needsSync) {
    console.log("\nGitHub Actions");
    console.log("✓ Dev CI secrets already synced — skip");
    return;
  }

  const ghReady = cliContext ? canAutomateGh(cliContext) : await isGhAuthenticated();

  console.log("\nGitHub Actions");
  if (!firstSync && missingOnGitHub.length > 0) {
    console.log(`  Missing on GitHub: ${missingOnGitHub.join(", ")}`);
  }
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
    defaultYes: needsSync && ghReady,
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

  let allSecretsOk = true;
  let deployKeyOk = !needsDeployKey || remoteSecrets.has("CONVEX_DEPLOY_KEY");
  if (firstSync || needsDeployKey) {
    const deployKey = await resolveDevConvexDeployKey(root, "github-ci");
    if (!deployKey) {
      printManualAction("Mint CONVEX_DEPLOY_KEY for CI", [
        "Resume `bun run setup` — complete the Convex step first",
        "Then confirm the GitHub Actions sync step",
      ]);
      return;
    }
    deployKeyOk = await ghSecretSet(root, "CONVEX_DEPLOY_KEY", deployKey);
    console.log(deployKeyOk ? "✓ CONVEX_DEPLOY_KEY" : "○ Failed to set CONVEX_DEPLOY_KEY");
    if (!deployKeyOk) {
      allSecretsOk = false;
    }
  }

  for (const name of REPO_ENV_SECRETS) {
    const value = webEnv[name];
    if (!isLocalRepoSecretReady(name, value)) {
      console.log(`○ Skip ${name} — not set in ${WEB_ENV}`);
      continue;
    }
    if (!firstSync && remoteSecrets.has(name) && !missingOnGitHub.includes(name)) {
      continue;
    }
    const ok = await ghSecretSet(root, name, value!);
    console.log(ok ? `✓ ${name}` : `○ Failed to set ${name}`);
    if (!ok) {
      allSecretsOk = false;
    }
  }

  const updatedRemoteSecrets = new Set(await listGhRepoSecrets(root));
  const stillMissing = REPO_ENV_SECRETS.filter(
    (name) => isLocalRepoSecretReady(name, webEnv[name]) && !updatedRemoteSecrets.has(name),
  );

  if (deployKeyOk && allSecretsOk && stillMissing.length === 0) {
    markGithubSecretsSynced(root);
  } else if (!allSecretsOk || stillMissing.length > 0) {
    console.log("○ repo secrets not marked synced — fix failures above and resume setup");
    if (stillMissing.length > 0) {
      console.log(`○ Still missing on GitHub: ${stillMissing.join(", ")}`);
    }
  }
}
