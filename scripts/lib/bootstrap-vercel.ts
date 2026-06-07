/* eslint-disable no-console -- CLI wizard */
import { deriveHostnames } from "../../packages/config/hostnames";
import { isPlaceholderEnvValue } from "../../packages/config/env-placeholders";
import type { GitHubRepo } from "./repo-identity";
import { readEnvFile } from "./env-file";
import { ghSecretSet, isGhAuthenticated } from "./gh-secrets";
import { offerOpenUrl } from "./open-url";
import { VERCEL_DASHBOARD, VERCEL_NEW_PROJECT, VERCEL_TOKENS } from "./platform-urls";
import { maskSecret, promptConfirm, promptLine } from "./prompt";
import {
  markVercelGithubSecretsSynced,
  markVercelSynced,
  type SetupConfig,
  type VercelSetupMeta,
} from "./setup-config";
import {
  addVercelProjectDomain,
  createVercelProject,
  findVercelProjectByName,
  getVercelAuthContext,
  getVercelDomainConfig,
  upsertVercelProjectEnv,
  vercelOrgId,
  VercelApiError,
  type VercelProject,
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
  const token = await promptLine("VERCEL_TOKEN (Account → Tokens)", {
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
): Promise<VercelProject> {
  if (existingId) {
    const byName = await findVercelProjectByName(token, teamId, projectName);
    if (byName?.id === existingId) {
      return byName;
    }
  }

  const existing = await findVercelProjectByName(token, teamId, projectName);
  if (existing) {
    console.log(`✓ Vercel project "${projectName}" already exists`);
    return existing;
  }

  const commands = readVercelJsonCommands(root, spec.appDir);
  const gitRepository = github
    ? { type: "github" as const, repo: `${github.org}/${github.repo}` }
    : undefined;

  try {
    const created = await createVercelProject(token, teamId, {
      name: projectName,
      rootDirectory: spec.appDir,
      framework: spec.framework,
      ...commands,
      gitRepository,
    });
    console.log(`✓ Created Vercel project "${projectName}" (${created.id})`);
    return created;
  } catch (err) {
    if (err instanceof VercelApiError) {
      console.warn(`○ Could not create "${projectName}" via API — import manually:`);
      console.log(`  Root directory: ${spec.appDir}`);
      if (github) {
        console.log(`  Repository: ${github.org}/${github.repo}`);
      }
      await offerOpenUrl(VERCEL_NEW_PROJECT);
      const manual = await promptLine(`Paste ${spec.suffix} project ID (prj_…) after creating`, {
        required: true,
      });
      return { id: manual.trim(), name: projectName, rootDirectory: spec.appDir };
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

/**
 * Adds custom domains to a project and prints DNS hints.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Vercel project ID
 * @param domains - Hostnames to attach
 */
async function attachDomains(
  token: string,
  teamId: string | undefined,
  projectId: string,
  domains: string[],
): Promise<void> {
  for (const domain of domains) {
    try {
      await addVercelProjectDomain(token, teamId, projectId, domain);
      console.log(`✓ Domain ${domain} → project ${projectId}`);
    } catch (err) {
      const detail = err instanceof VercelApiError ? err.body.slice(0, 120) : String(err);
      console.log(`○ Could not add ${domain} via API (${detail}) — add in Vercel dashboard`);
    }
  }
}

/**
 * Prints registrar DNS records from the Vercel domain config API.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param hostnames - Hostnames to look up
 */
async function printDnsHints(
  token: string,
  teamId: string | undefined,
  hostnames: string[],
): Promise<void> {
  console.log("\nDNS (at your registrar)");
  for (const host of hostnames) {
    try {
      const config = await getVercelDomainConfig(token, teamId, host);
      const cname = config.recommendedCNAME?.[0]?.value;
      if (cname) {
        console.log(`  ${host} → CNAME → ${cname}`);
      } else {
        console.log(`  ${host} → configure in Vercel (${VERCEL_DASHBOARD})`);
      }
    } catch {
      console.log(`  ${host} → configure in Vercel (${VERCEL_DASHBOARD})`);
    }
  }
  console.log(
    "\n  Assign pre-release hostnames (dev.*) to Preview and production hostnames to Production in each project's Domains settings.",
  );
}

/**
 * Syncs Vercel deploy credentials to GitHub repository secrets.
 *
 * @param root - Repository root
 * @param token - Vercel API token
 * @param meta - Vercel project metadata
 * @param setup - Setup config
 */
async function maybeSyncVercelGithubSecrets(
  root: string,
  token: string,
  meta: VercelSetupMeta,
  setup: SetupConfig,
): Promise<void> {
  const firstSync = !setup.vercelGithubSecretsSynced;
  const proceed = await promptConfirm("Sync Vercel deploy secrets to GitHub?", {
    defaultYes: firstSync,
  });
  if (!proceed) {
    console.log("○ Skipped Vercel GitHub secrets — docs/ci-cd.md#repository-secrets");
    return;
  }

  if (!(await isGhAuthenticated())) {
    console.log("○ GitHub CLI not authenticated — run: gh auth login");
    return;
  }

  const pairs: Array<[string, string]> = [
    ["VERCEL_TOKEN", token],
    ["VERCEL_ORG_ID", meta.orgId],
    ["VERCEL_WEB_PROJECT_ID", meta.webProjectId],
    ["VERCEL_MARKETING_PROJECT_ID", meta.marketingProjectId],
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
 */
export async function bootstrapVercel(
  root: string,
  setup: SetupConfig,
  github: GitHubRepo | null,
): Promise<void> {
  const hostnames = deriveHostnames(setup.apexDomain);
  const firstSetup = !setup.vercelSynced;

  console.log("\nVercel");
  console.log(
    "  Creates or links two projects (apps/web, apps/marketing), sets web build env vars,",
  );
  console.log("  attaches custom domains, and can sync VERCEL_* secrets to GitHub.");
  console.log("  API token:");
  await offerOpenUrl(VERCEL_TOKENS);

  const proceed = await promptConfirm("Set up Vercel for web and marketing?", {
    defaultYes: firstSetup,
  });
  if (!proceed) {
    console.log("○ Skipped — docs/environments.md#vercel-web--marketing");
    return;
  }

  const token = await promptVercelToken();
  if (!token) {
    console.log("○ VERCEL_TOKEN required");
    return;
  }

  let auth;
  try {
    auth = await getVercelAuthContext(token);
    console.log(`✓ Vercel authenticated (org ${vercelOrgId(auth)})`);
  } catch {
    console.log("○ Invalid Vercel token — create one at:");
    console.log(`  ${VERCEL_TOKENS}`);
    return;
  }

  const teamId = auth.teamId;
  const repoSlug = github?.repo ?? setup.productName.toLowerCase().replace(/\s+/g, "-");
  const names = vercelProjectNames(repoSlug);
  const specs = vercelAppSpecs();

  const webSpec = specs.find((s) => s.suffix === "web")!;
  const marketingSpec = specs.find((s) => s.suffix === "marketing")!;

  const webProject = await ensureVercelProject(
    token,
    teamId,
    webSpec,
    names.web,
    github,
    setup.vercel?.webProjectId,
    root,
  );
  const marketingProject = await ensureVercelProject(
    token,
    teamId,
    marketingSpec,
    names.marketing,
    github,
    setup.vercel?.marketingProjectId,
    root,
  );

  await syncWebVercelEnv(token, teamId, webProject.id, root);

  await attachDomains(token, teamId, webProject.id, [
    hostnames.webProduction,
    hostnames.webPreRelease,
  ]);
  await attachDomains(token, teamId, marketingProject.id, [
    hostnames.marketingProduction,
    hostnames.marketingPreRelease,
  ]);

  const meta: VercelSetupMeta = {
    orgId: vercelOrgId(auth),
    webProjectId: webProject.id,
    marketingProjectId: marketingProject.id,
    webProjectName: webProject.name,
    marketingProjectName: marketingProject.name,
  };
  markVercelSynced(root, meta);

  await printDnsHints(token, teamId, [
    hostnames.webProduction,
    hostnames.webPreRelease,
    hostnames.marketingProduction,
    hostnames.marketingPreRelease,
  ]);

  await maybeSyncVercelGithubSecrets(root, token, meta, setup);
}
