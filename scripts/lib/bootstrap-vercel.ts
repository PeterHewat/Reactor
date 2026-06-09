/* eslint-disable no-console -- CLI wizard */
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import { deriveHostnames } from "../../packages/config/hostnames";
import { readEnvFile } from "./env-file";
import { ghSecretSet, isGhAuthenticated } from "./gh-secrets";
import { printManualAction } from "./manual-action";
import { VERCEL_DASHBOARD, VERCEL_NEW_PROJECT, VERCEL_TOKENS } from "./platform-urls";
import { maskSecret, promptConfirm, promptLine } from "./prompt";
import { productNameToSlug, type GitHubRepo } from "./repo-identity";
import {
  markVercelGithubSecretsSynced,
  markVercelSynced,
  type SetupConfig,
  type VercelSetupMeta,
} from "./setup-config";
import {
  createVercelProject,
  ensureVercelProjectDomain,
  findVercelProjectByName,
  formatVercelApiError,
  getVercelAuthContext,
  getVercelDomainConfig,
  loadVercelProjectDetails,
  upsertVercelProjectEnv,
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

const WEB_ENV = "apps/web/.env.local";
const ENV_TARGETS = ["production", "preview", "development"] as const;

/**
 * Prompts for a Vercel API token (prefers `VERCEL_TOKEN` env).
 */
async function promptVercelToken(): Promise<string | null> {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  printManualAction("Create a Vercel API token", [
    `Account → Tokens (any label): ${VERCEL_TOKENS}`,
    "Paste the token value when prompted below — VERCEL_TOKEN is the GitHub secret name, not the Vercel label",
  ]);
  const token = await promptLine("Paste your Vercel API token", {
    defaultValue: fromEnv,
    displayDefault: fromEnv ? maskSecret(fromEnv) : undefined,
    required: !fromEnv,
  });
  const trimmed = token.trim();
  return trimmed || null;
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
 */
async function ensureVercelProject(
  token: string,
  teamId: string | undefined,
  spec: VercelAppSpec,
  projectName: string,
  github: GitHubRepo | null,
  existingId: string | undefined,
  root: string,
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

  try {
    const created = await createVercelProject(token, teamId, {
      name: projectName,
      rootDirectory: spec.appDir,
      framework: spec.framework,
      ...commands,
      ...(github
        ? { gitRepository: { type: "github", repo: `${github.org}/${github.repo}` } }
        : {}),
    });
    console.log(`✓ Created Vercel project "${projectName}" (${created.id})`);
    return created;
  } catch (err) {
    if (err instanceof VercelApiError) {
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
    throw err;
  }
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
 * Prints registrar DNS records from the Vercel domain config API.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param hostnames - Hostnames to look up
 */
function isApexHostname(host: string, apex: string): boolean {
  return host === apex;
}

/**
 * Prints one DNS hint line for a hostname.
 *
 * @param host - Hostname
 * @param apex - Apex domain
 * @param config - Vercel domain config response
 */
function formatDnsHint(
  host: string,
  apex: string,
  config: Awaited<ReturnType<typeof getVercelDomainConfig>>,
): string {
  if (isApexHostname(host, apex)) {
    const ipv4 = config.recommendedIPv4?.find((r) => r.rank === 1)?.value?.[0];
    if (ipv4) {
      return `${host} → A → ${ipv4}`;
    }
    return `${host} → A → 76.76.21.21 (confirm in Vercel Domains UI)`;
  }
  const cname = config.recommendedCNAME?.find((r) => r.rank === 1)?.value;
  if (cname) {
    return `${host} → CNAME → ${cname}`;
  }
  return `${host} → CNAME → cname.vercel-dns.com (confirm in Vercel Domains UI)`;
}

async function printDnsHints(
  token: string,
  teamId: string | undefined,
  apex: string,
  hostnames: string[],
): Promise<void> {
  console.log("\nDNS (at your registrar)");
  const dnsLines: string[] = [];
  for (const host of hostnames) {
    try {
      const config = await getVercelDomainConfig(token, teamId, host);
      dnsLines.push(formatDnsHint(host, apex, config));
    } catch {
      dnsLines.push(`${host} → see Vercel Domains UI (${VERCEL_DASHBOARD})`);
    }
  }
  for (const line of dnsLines) {
    console.log(`  ${line}`);
  }
  printManualAction("Configure DNS at your registrar", [
    "Create each DNS record shown above (apex uses A, subdomains use CNAME)",
    "Production: apex + `www` (Release workflow only). Staging: `preview.*` on branch `main` via Vercel Git",
    "Environment assignment is under Settings → Environments if a hostname is on the wrong target",
    "Wait until each domain shows **Valid** before testing Clerk or releases",
  ]);
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
): Promise<void> {
  if (setup.github?.syncedSecrets?.vercel) {
    console.log("✓ Vercel GitHub secrets already synced — skip");
    return;
  }

  if (!(await isGhAuthenticated())) {
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
): Promise<string | null> {
  const hostnames = deriveHostnames(setup.apexDomain);
  const firstSetup = !setup.vercel?.synced;

  if (!firstSetup) {
    console.log("\nVercel");
    console.log("✓ Vercel already configured — skip");
    return process.env.VERCEL_TOKEN?.trim() ?? null;
  }

  console.log("\nVercel");
  console.log(
    "  Creates or links two Git-connected projects (apps/web, apps/marketing), sets env vars,",
  );
  console.log(
    "  attaches domains (staging on `main`, production via Release), syncs VERCEL_* to GitHub.",
  );

  const proceed = await promptConfirm("Set up Vercel for web and marketing?", {
    defaultYes: firstSetup,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/environments.md#vercel-web--marketing");
    return null;
  }

  const token = await promptVercelToken();
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
  );
  const marketingProject = await ensureVercelProject(
    token,
    teamId,
    marketingSpec,
    names.marketing,
    github,
    setup.vercel?.projectIdMarketing,
    root,
  );

  await syncWebVercelEnv(token, teamId, webProject.id, root);

  const webDomainsOk = await attachProjectDomains(token, teamId, webProject, [
    { domain: hostnames.webProduction, target: "production" },
    { domain: hostnames.webPreRelease, target: "preview" },
  ]);
  const marketingDomainsOk = await attachProjectDomains(token, teamId, marketingProject, [
    { domain: hostnames.marketingProduction, target: "production" },
    { domain: hostnames.marketingPreRelease, target: "preview" },
  ]);

  const meta: VercelSetupMeta = {
    orgId: vercelOrgId(auth),
    projectIdWeb: webProject.id,
    projectIdMarketing: marketingProject.id,
    projectNameWeb: webProject.name,
    projectNameMarketing: marketingProject.name,
  };
  markVercelSynced(root, meta);

  await printDnsHints(token, teamId, hostnames.apex, [
    hostnames.webProduction,
    hostnames.webPreRelease,
    hostnames.marketingProduction,
    hostnames.marketingPreRelease,
  ]);

  printVercelGitStagingGuide();

  if (!webDomainsOk || !marketingDomainsOk) {
    printManualAction("Fix Vercel domain setup (optional to continue)", [
      `Production: ${hostnames.webProduction}, ${hostnames.marketingProduction}`,
      `Staging: ${hostnames.webPreRelease}, ${hostnames.marketingPreRelease} on branch ${VERCEL_STAGING_GIT_BRANCH}`,
      "Resume `bun run setup` after fixing, or continue below to sync VERCEL_* secrets",
    ]);
  }

  await syncVercelGithubSecrets(root, token, meta, setup);
  return token;
}
