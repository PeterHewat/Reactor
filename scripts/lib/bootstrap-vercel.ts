/* eslint-disable no-console -- CLI wizard */
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { deriveHostnames } from "../../packages/config/hostnames";
import { hasApexDomain } from "../../packages/config/validate-domain";
import { readEnvFile } from "./env-file";
import { ghSecretSet, isGhAuthenticated } from "./gh-secrets";
import { canAutomateGh, type SetupCliContext } from "./setup-cli";
import { exitWithManualAction, printManualAction } from "./manual-action";
import { VERCEL_DASHBOARD, VERCEL_NEW_PROJECT, VERCEL_TOKENS } from "./platform-urls";
import { promptConfirm, promptLine, promptSecret } from "./prompt";
import { productNameToSlug, type GitHubRepo } from "./repo-identity";
import {
  markVercelDnsConfigured,
  markVercelGithubSecretsSynced,
  markVercelSynced,
  type SetupConfig,
  type VercelSetupMeta,
} from "./setup-config";
import {
  ensureVercelGitHubReady,
  isRecoverableVercelGitError,
  linkVercelProjectToGitHub,
  logVercelGitIntegrationWarning,
} from "./vercel-git";
import {
  createVercelProject,
  ensureVercelProjectDomain,
  ensureVercelTeamDomain,
  findVercelProjectByName,
  formatVercelApiError,
  getVercelAuthContext,
  loadVercelProjectDetails,
  upsertVercelProjectEnv,
  VERCEL_DNS_NAMESERVERS,
  VERCEL_STAGING_GIT_BRANCH,
  VercelApiError,
  vercelOrgId,
  type VercelDeploymentTarget,
  type VercelProjectDetails,
} from "./vercel-api";
import {
  readVercelJsonCommands,
  vercelAppSpecs,
  vercelProjectNames,
  type VercelAppSpec,
} from "./vercel-project-spec";
import { mintVercelCiTokenViaCli, resolveVercelApiToken } from "./vercel-auth";

const WEB_ENV = "apps/web/.env.local";
const ENV_TARGETS = ["production", "preview", "development"] as const;

/**
 * Resolves a Vercel API token for setup (env, CLI session, or manual paste).
 *
 * @param root - Repository root
 */
async function resolveOrPromptVercelToken(root: string): Promise<string | null> {
  const resolved = await resolveVercelApiToken(root);
  if (resolved) {
    const label =
      resolved.source === "env"
        ? "VERCEL_TOKEN env"
        : resolved.source === "cli_session"
          ? "`vercel login` session"
          : "`vercel tokens add`";
    console.log(`✓ Vercel API token — ${label}`);
    return resolved.token;
  }

  printManualAction("Create a Vercel API token (classic personal access token)", [
    `If you ran \`bunx vercel login\`, also create a classic token for CI: ${VERCEL_TOKENS}`,
    "OAuth login alone cannot mint tokens — dashboard → Account → Tokens → Create",
    "Paste the token below — VERCEL_TOKEN is the GitHub secret name, not the Vercel label",
  ]);
  const token = await promptSecret("Paste your Vercel API token", { required: true });
  const trimmed = token.trim();
  return trimmed || null;
}

/**
 * Returns a long-lived token suitable for GitHub `VERCEL_TOKEN` secrets.
 *
 * @param root - Repository root
 * @param setupToken - Token already used during this setup run
 */
async function resolveVercelCiToken(root: string, setupToken: string): Promise<string> {
  if (process.env.VERCEL_TOKEN?.trim()) {
    return process.env.VERCEL_TOKEN.trim();
  }
  const minted = await mintVercelCiTokenViaCli(root, "reactor-github-ci");
  if (minted && "token" in minted) {
    console.log("✓ Minted classic VERCEL_TOKEN via `bunx vercel tokens add`");
    return minted.token;
  }
  if (minted && "classicRequired" in minted) {
    console.log("○ `vercel login` is OAuth-only — create a classic token for GitHub Actions CI");
    printManualAction("Create a classic Vercel token for CI (recommended)", [
      `OAuth login works for setup, but GitHub Actions needs a classic token: ${VERCEL_TOKENS}`,
      "Re-run setup after creating one, or set VERCEL_TOKEN in the environment",
    ]);
  }
  return setupToken;
}

/**
 * Resolves an existing or new Vercel project for a monorepo app.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param spec - App spec (web or marketing)
 * @param projectName - Vercel project name
 * @param github - Linked GitHub repo, if any
 * @param existingId - Previously saved project ID
 * @param root - Repository root
 * @param gitReady - Whether Vercel GitHub integration is connected for this repo
 */
async function ensureVercelProject(
  token: string,
  teamId: string | undefined,
  spec: VercelAppSpec,
  projectName: string,
  github: GitHubRepo | null,
  existingId: string | undefined,
  root: string,
  gitReady: boolean,
): Promise<VercelProjectDetails> {
  if (existingId) {
    const byName = await findVercelProjectByName(token, teamId, projectName);
    if (byName?.id === existingId) {
      return loadVercelProjectDetails(token, teamId, byName);
    }
  }

  const existing = await findVercelProjectByName(token, teamId, projectName);
  if (existing) {
    console.log(`✓ Vercel project "${projectName}" already exists`);
    return loadVercelProjectDetails(token, teamId, existing);
  }

  const commands = readVercelJsonCommands(root, spec.appDir);
  const baseInput = {
    name: projectName,
    rootDirectory: spec.appDir,
    framework: spec.framework,
    ...commands,
  };
  const repoPath = github ? `${github.org}/${github.repo}` : null;

  if (github && gitReady && repoPath) {
    try {
      const created = await createVercelProject(token, teamId, {
        ...baseInput,
        gitRepository: { type: "github", repo: repoPath },
      });
      console.log(`✓ Created Vercel project "${projectName}" (${created.id})`);
      return created;
    } catch (err) {
      if (!isRecoverableVercelGitError(err)) {
        return promptManualVercelProjectImport(spec, projectName, github, err);
      }
      console.warn(`○ Create with Git link failed — creating project then linking`);
      logVercelGitIntegrationWarning(err);
    }
  }

  try {
    const created = await createVercelProject(token, teamId, baseInput);
    console.log(`✓ Created Vercel project "${projectName}" (${created.id})`);
    if (github && gitReady) {
      await linkVercelProjectToGitHub(token, teamId, created.id, github);
    } else if (github && !gitReady) {
      console.warn(`○ Skipped Git link — connect GitHub to Vercel, then re-run setup`);
    }
    return created;
  } catch (err) {
    if (err instanceof VercelApiError) {
      return promptManualVercelProjectImport(spec, projectName, github, err);
    }
    throw err;
  }
}

/**
 * Falls back to manual Vercel import when API project creation fails.
 *
 * @param spec - App spec (web or marketing)
 * @param projectName - Vercel project name
 * @param github - Linked GitHub repo, if any
 * @param err - API error that triggered the fallback
 */
async function promptManualVercelProjectImport(
  spec: VercelAppSpec,
  projectName: string,
  github: GitHubRepo | null,
  err: VercelApiError,
): Promise<VercelProjectDetails> {
  console.warn(`○ Could not create "${projectName}" via API (${err.status}) — import manually`);
  console.warn(`  ${formatVercelApiError(err)}`);
  printManualAction(`Import Vercel project "${projectName}" from GitHub`, [
    `Import repository: ${VERCEL_NEW_PROJECT}`,
    "Choose **Import Git Repository** (not Create Empty Project)",
    github ? `Select repository ${github.org}/${github.repo}` : "Select your GitHub repository",
    `Set project name to **${projectName}**`,
    `Set root directory to **${spec.appDir}**`,
    "Git link is required — merges to `main` deploy staging; production ships via GitHub Actions Release",
    `Paste the project ID (prj_…) below when done`,
  ]);
  const manual = await promptLine(`${spec.suffix} project ID (prj_…)`, {
    required: true,
  });
  return { id: manual.trim(), name: projectName };
}

/**
 * Sets web build env vars on the Vercel web project (dev stack values).
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Web project ID
 * @param root - Repository root
 */
async function syncWebVercelEnv(
  token: string,
  teamId: string | undefined,
  projectId: string,
  root: string,
): Promise<void> {
  const webEnv = readEnvFile(root, WEB_ENV);
  const pairs: Array<[string, string | undefined]> = [
    ["VITE_CONVEX_URL", webEnv.VITE_CONVEX_URL],
    ["VITE_CLERK_PUBLISHABLE_KEY", webEnv.VITE_CLERK_PUBLISHABLE_KEY],
  ];

  for (const [key, value] of pairs) {
    if (!value || isPlaceholderEnvValue(value)) {
      console.log(`○ Skip Vercel env ${key} — not set in ${WEB_ENV}`);
      continue;
    }
    await upsertVercelProjectEnv(token, teamId, projectId, key, value, [...ENV_TARGETS]);
    console.log(`✓ Vercel env ${key} (${ENV_TARGETS.join(", ")})`);
  }
}

type VercelDomainSpec = {
  domain: string;
  target: VercelDeploymentTarget;
};

/**
 * Post-setup checklist so `main` deploys staging without promoting production domains.
 */
function printVercelGitStagingGuide(): void {
  printManualAction("Configure Vercel Git for staging on main", [
    `Each project → **Settings → Git** → Production Branch = \`production\` (not \`main\`)`,
    `Create an empty \`production\` branch once if needed: \`git checkout --orphan production && git commit --allow-empty -m init && git push -u origin production\``,
    `Merges to \`${VERCEL_STAGING_GIT_BRANCH}\` then deploy **Preview** builds to \`preview.*\` hostnames`,
    "Production (`apex` / `www`) ships only via **Release** workflow (`vercel deploy --prod` in GitHub Actions)",
    `Only \`${VERCEL_STAGING_GIT_BRANCH}\` triggers Vercel builds (\`ignoreCommand\` in vercel.json skips PR branches)`,
  ]);
}

/**
 * Adds custom domains to a project on Production or Preview.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domains - Hostnames and deployment targets
 */
async function attachProjectDomains(
  token: string,
  teamId: string | undefined,
  project: VercelProjectDetails,
  domains: VercelDomainSpec[],
): Promise<boolean> {
  const details = await loadVercelProjectDetails(token, teamId, project);
  let allOk = true;
  for (const { domain, target } of domains) {
    try {
      await ensureVercelProjectDomain(token, teamId, details.id, domain, target, details);
      const envLabel =
        target === "preview" ? `preview (branch ${VERCEL_STAGING_GIT_BRANCH})` : target;
      console.log(`✓ Domain ${domain} → ${envLabel} (${details.id})`);
    } catch (err) {
      allOk = false;
      const detail =
        err instanceof VercelApiError ? formatVercelApiError(err) : String(err).slice(0, 120);
      if (target === "preview") {
        printManualAction(`Assign ${domain} to branch ${VERCEL_STAGING_GIT_BRANCH} in Vercel`, [
          `${VERCEL_DASHBOARD} → **${project.name}** → **Domains** → Add ${domain}`,
          `Assign to git branch **${VERCEL_STAGING_GIT_BRANCH}** (or Environments → Preview after Git is connected)`,
          "Complete the Git staging checklist printed after setup",
          `API error: ${detail}`,
        ]);
      } else {
        printManualAction(`Add domain ${domain} to Production in Vercel`, [
          `${VERCEL_DASHBOARD} → **${project.name}** → Domains → Add ${domain}`,
          `API error: ${detail}`,
        ]);
      }
    }
  }
  return allOk;
}

/**
 * Attaches Reactor hostnames to web and marketing Vercel projects when an apex is configured.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param apex - Apex domain
 * @param webProject - Web project metadata
 * @param marketingProject - Marketing project metadata
 */
async function attachReactorCustomDomains(
  token: string,
  teamId: string | undefined,
  apex: string,
  webProject: VercelProjectDetails,
  marketingProject: VercelProjectDetails,
): Promise<{ webOk: boolean; marketingOk: boolean }> {
  const hostnames = deriveHostnames(apex);
  try {
    await ensureVercelTeamDomain(token, teamId, hostnames.apex);
    console.log(`✓ Apex domain ${hostnames.apex} on Vercel team`);
  } catch (err) {
    const detail =
      err instanceof VercelApiError ? formatVercelApiError(err) : String(err).slice(0, 120);
    console.log(`○ Could not add ${hostnames.apex} to Vercel Domains — add manually: ${detail}`);
  }

  const webOk = await attachProjectDomains(token, teamId, webProject, [
    { domain: hostnames.webProduction, target: "production" },
    { domain: hostnames.webPreRelease, target: "preview" },
  ]);
  const marketingOk = await attachProjectDomains(token, teamId, marketingProject, [
    { domain: hostnames.marketingProduction, target: "production" },
    { domain: hostnames.marketingPreRelease, target: "preview" },
  ]);
  return { webOk, marketingOk };
}

/**
 * Prints Vercel DNS nameserver instructions (registrar keeps the domain; DNS delegates to Vercel).
 *
 * @param apex - Apex domain
 * @param hostnames - Project hostnames setup attached
 */
function printVercelDnsInstructions(apex: string, hostnames: string[]): void {
  console.log("\nDNS — delegate to Vercel (keep your registrar, e.g. OVH)");
  console.log(`  Domain: ${apex}`);
  for (const ns of VERCEL_DNS_NAMESERVERS) {
    console.log(`  Nameserver: ${ns}`);
  }
  console.log("  Hostnames (DNS records created automatically once nameservers propagate):");
  for (const host of hostnames) {
    console.log(`    ${host}`);
  }
  printManualAction("Point your registrar nameservers to Vercel", [
    `${VERCEL_DASHBOARD} → Domains → ${apex} → enable **Vercel DNS** if prompted`,
    `At your registrar, replace DNS servers with ${VERCEL_DNS_NAMESERVERS.join(" and ")}`,
    "Copy any existing DNS you still need (e.g. email MX/TXT) into Vercel before switching",
    "Production: apex + `www` (Release workflow only). Staging: `preview.*` on branch `main` via Vercel Git",
    "Wait until each hostname shows **Valid** in Vercel Domains before testing Clerk or releases",
  ]);
}

/**
 * Blocks setup until the user confirms registrar DNS (or exits to configure later).
 *
 * @param root - Repository root
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param apex - Apex domain
 * @param hostnames - Hostnames to list
 */
async function awaitDnsConfiguration(
  root: string,
  apex: string,
  hostnames: string[],
): Promise<void> {
  printVercelDnsInstructions(apex, hostnames);
  const ready = await promptConfirm(
    "Nameservers updated at your registrar? (continue only after Vercel Domains show Valid)",
    { defaultYes: false },
  );
  if (!ready) {
    exitWithManualAction("Point registrar nameservers to Vercel", [
      `Set nameservers to ${VERCEL_DNS_NAMESERVERS.join(" and ")} at your registrar`,
      "Enable Vercel DNS on the domain in the Vercel Domains UI",
      "Wait until each hostname shows **Valid** in Vercel Domains",
      "Re-run `bun run setup` when DNS is ready",
    ]);
  }
  markVercelDnsConfigured(root);
  console.log("✓ Vercel DNS configuration confirmed");
}

/**
 * Resumes setup when Vercel projects exist but DNS is not yet confirmed.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 * @param cliContext - Optional CLI auth context
 */
async function resumeDnsConfiguration(
  root: string,
  setup: SetupConfig,
  cliContext?: SetupCliContext,
): Promise<string | null> {
  if (!hasApexDomain(setup.apexDomain)) {
    return process.env.VERCEL_TOKEN?.trim() ?? null;
  }

  const hostnames = deriveHostnames(setup.apexDomain!);
  const token = await resolveOrPromptVercelToken(root);
  if (!token) {
    console.log("○ VERCEL_TOKEN required to show DNS instructions");
    return null;
  }

  let teamId: string | undefined;
  try {
    teamId = (await getVercelAuthContext(token)).teamId;
  } catch {
    printManualAction("Create a valid Vercel API token", [
      `Account → Tokens: ${VERCEL_TOKENS}`,
      "Re-run `bun run setup` and paste the new token",
    ]);
    return null;
  }

  const vercel = setup.vercel!;
  const webProject = await loadVercelProjectDetails(token, teamId, vercel.projectIdWeb);
  const marketingProject = await loadVercelProjectDetails(token, teamId, vercel.projectIdMarketing);
  await attachReactorCustomDomains(token, teamId, hostnames.apex, webProject, marketingProject);

  await awaitDnsConfiguration(root, hostnames.apex, [
    hostnames.webProduction,
    hostnames.webPreRelease,
    hostnames.marketingProduction,
    hostnames.marketingPreRelease,
  ]);

  const ciToken = await resolveVercelCiToken(root, token);
  await syncVercelGithubSecrets(root, ciToken, vercel, setup, cliContext);
  return token;
}

/**
 * Syncs Vercel deploy credentials to GitHub repository secrets.
 *
 * @param root - Repository root
 * @param token - Vercel API token
 * @param meta - Vercel project metadata
 * @param setup - Setup config
 */
async function syncVercelGithubSecrets(
  root: string,
  token: string,
  meta: VercelSetupMeta,
  setup: SetupConfig,
  cliContext?: SetupCliContext,
): Promise<void> {
  if (setup.github?.syncedSecrets?.vercel) {
    console.log("✓ Vercel GitHub secrets already synced — skip");
    return;
  }

  const ghReady = cliContext ? canAutomateGh(cliContext) : await isGhAuthenticated();
  if (!ghReady) {
    printManualAction("Authenticate GitHub CLI", [
      "Run `gh auth login` in a terminal",
      "Re-run `bun run setup` and confirm the Vercel GitHub secrets sync step",
    ]);
    return;
  }

  const pairs: Array<[string, string]> = [
    ["VERCEL_TOKEN", token],
    ["VERCEL_ORG_ID", meta.orgId],
    ["VERCEL_WEB_PROJECT_ID", meta.projectIdWeb],
    ["VERCEL_MARKETING_PROJECT_ID", meta.projectIdMarketing],
  ];

  let okCount = 0;
  for (const [name, value] of pairs) {
    const ok = await ghSecretSet(root, name, value);
    console.log(ok ? `✓ ${name}` : `○ Failed to set ${name}`);
    if (ok) {
      okCount += 1;
    }
  }

  if (okCount === pairs.length) {
    markVercelGithubSecretsSynced(root);
  }
}

/**
 * Interactive Vercel bootstrap: projects, env vars, domains, GitHub secrets.
 *
 * @param root - Repository root
 * @param setup - Persisted setup config
 * @param github - Parsed GitHub remote, if any
 * @returns Vercel API token when setup ran or was skipped with `VERCEL_TOKEN` in env
 */
export async function bootstrapVercel(
  root: string,
  setup: SetupConfig,
  github: GitHubRepo | null,
  cliContext?: SetupCliContext,
): Promise<string | null> {
  const hasApex = hasApexDomain(setup.apexDomain);
  const vercelSynced = setup.vercel?.synced;
  const dnsConfigured = setup.vercel?.dnsConfigured;

  if (vercelSynced && (dnsConfigured || !hasApex)) {
    console.log("\nVercel");
    console.log("✓ Vercel already configured — skip");
    return process.env.VERCEL_TOKEN?.trim() ?? null;
  }

  if (vercelSynced && !dnsConfigured && hasApex) {
    console.log("\nVercel");
    console.log("  Confirm Vercel DNS at your registrar before continuing.");
    return resumeDnsConfiguration(root, setup, cliContext);
  }

  const firstSetup = !vercelSynced;

  console.log("\nVercel");
  console.log(
    "  Creates or links two Git-connected projects (apps/web, apps/marketing), sets env vars,",
  );
  console.log(
    "  attaches custom domains when an apex is set (staging on `main`, production via Release), syncs VERCEL_* to GitHub.",
  );

  const proceed = await promptConfirm("Set up Vercel for web and marketing?", {
    defaultYes: firstSetup,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/environments.md#vercel-web--marketing");
    return null;
  }

  const token = await resolveOrPromptVercelToken(root);
  if (!token) {
    console.log("○ VERCEL_TOKEN required");
    return null;
  }

  let auth;
  try {
    auth = await getVercelAuthContext(token);
    console.log(`✓ Vercel authenticated (org ${vercelOrgId(auth)})`);
  } catch {
    printManualAction("Create a valid Vercel API token", [
      `Account → Tokens: ${VERCEL_TOKENS}`,
      "Re-run `bun run setup` and paste the new token",
    ]);
    return null;
  }

  const teamId = auth.teamId;
  const gitReady = github ? await ensureVercelGitHubReady(token, github) : false;
  const names = vercelProjectNames(productNameToSlug(setup.productName));
  const specs = vercelAppSpecs();

  const webSpec = specs.find((s) => s.suffix === "web")!;
  const marketingSpec = specs.find((s) => s.suffix === "marketing")!;

  const webProject = await ensureVercelProject(
    token,
    teamId,
    webSpec,
    names.web,
    github,
    setup.vercel?.projectIdWeb,
    root,
    gitReady,
  );
  const marketingProject = await ensureVercelProject(
    token,
    teamId,
    marketingSpec,
    names.marketing,
    github,
    setup.vercel?.projectIdMarketing,
    root,
    gitReady,
  );

  await syncWebVercelEnv(token, teamId, webProject.id, root);

  const meta: VercelSetupMeta = {
    orgId: vercelOrgId(auth),
    projectIdWeb: webProject.id,
    projectIdMarketing: marketingProject.id,
    projectNameWeb: webProject.name,
    projectNameMarketing: marketingProject.name,
  };
  markVercelSynced(root, meta);

  let webDomainsOk = true;
  let marketingDomainsOk = true;

  if (hasApex) {
    const hostnames = deriveHostnames(setup.apexDomain!);
    const attached = await attachReactorCustomDomains(
      token,
      teamId,
      hostnames.apex,
      webProject,
      marketingProject,
    );
    webDomainsOk = attached.webOk;
    marketingDomainsOk = attached.marketingOk;

    await awaitDnsConfiguration(root, hostnames.apex, [
      hostnames.webProduction,
      hostnames.webPreRelease,
      hostnames.marketingProduction,
      hostnames.marketingPreRelease,
    ]);
  } else {
    console.log("\n○ Custom domains deferred — no apex domain in setup");
    console.log("  Projects use default *.vercel.app URLs until you add a domain and re-run setup");
  }

  printVercelGitStagingGuide();

  if (hasApex) {
    const hostnames = deriveHostnames(setup.apexDomain!);
    if (!webDomainsOk || !marketingDomainsOk) {
      printManualAction("Fix Vercel domain setup (optional before go-live)", [
        `Production: ${hostnames.webProduction}, ${hostnames.marketingProduction}`,
        `Staging: ${hostnames.webPreRelease}, ${hostnames.marketingPreRelease} on branch ${VERCEL_STAGING_GIT_BRANCH}`,
        "Resume `bun run setup` after fixing, or continue below to sync VERCEL_* secrets",
      ]);
    }
  }

  const ciToken = await resolveVercelCiToken(root, token);
  await syncVercelGithubSecrets(root, ciToken, meta, setup, cliContext);
  return token;
}
