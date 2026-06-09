#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Setup and readiness — safe to re-run anytime.
 *
 * @example
 * bun run setup
 */
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runClerkAgentSkillsIfNeeded, runConvexAgentSkillsIfNeeded } from "./lib/agent-skills";
import { applyIdentity, resolveGitHubRepo } from "./lib/apply-identity";
import { applyLicenseFromConfig } from "./lib/license-identity";
import { applyReadmeIdentity } from "./lib/readme-identity";
import { bootstrapCiSecrets } from "./lib/bootstrap-ci";
import { bootstrapClerkConvex } from "./lib/bootstrap-clerk-convex";
import { bootstrapProduction } from "./lib/bootstrap-production";
import { bootstrapVercel } from "./lib/bootstrap-vercel";
import { isConvexLinked } from "./lib/convex-link";
import { runIdentityWizard } from "./lib/prompt-identity";
import { runReadiness } from "./lib/readiness";
import { readSetupConfig } from "./lib/setup-config";

const root = resolve(import.meta.dir, "..");

/**
 * Copies `src` to `dest` when `dest` is missing.
 *
 * @returns Whether a new file was created
 */
function copyTemplateIfMissing(src: string, dest: string): boolean {
  const absSrc = resolve(root, src);
  const absDest = resolve(root, dest);
  if (existsSync(absDest)) {
    return false;
  }
  if (!existsSync(absSrc)) {
    console.warn(`○ Skip ${dest}: template ${src} not found`);
    return false;
  }
  copyFileSync(absSrc, absDest);
  console.log(`✓ Created ${dest} from ${src}`);
  return true;
}

/**
 * Runs `bun scripts/generate.ts` from the repo root.
 *
 * @returns Process exit code (0 = success)
 */
async function runGenerate(): Promise<number> {
  console.log("\n→ bun scripts/generate.ts");
  const proc = Bun.spawn(["bun", "scripts/generate.ts"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

async function main(): Promise<void> {
  const interactive = Boolean(process.stdin.isTTY);

  console.log("Reactor setup\n");

  copyTemplateIfMissing("apps/web/.env.example", "apps/web/.env.local");

  const github = resolveGitHubRepo(root);

  const setupConfig = interactive ? await runIdentityWizard(root, github) : readSetupConfig(root);

  if (!setupConfig && !interactive) {
    console.log("○ No .reactor/setup.json — run setup interactively once to configure identity");
  }

  if (github && setupConfig) {
    const identity = applyIdentity(root, github);
    console.log(
      `✓ Repository: ${github.repoUrl} → product name "${identity.productName}"${identity.rebranded ? "" : " (upstream template)"}`,
    );
    if (identity.changes.length > 0) {
      console.log(`✓ Updated: ${identity.changes.join(", ")}`);
    }
  } else if (github && !setupConfig) {
    const identity = applyIdentity(root, github);
    console.log(
      `✓ Repository: ${github.repoUrl} → product name "${identity.productName}"${identity.rebranded ? "" : " (upstream template)"}`,
    );
  } else if (!setupConfig) {
    console.log("○ No GitHub remote — product name stays at template default until you add origin");
  } else {
    const readmeUpdated = applyReadmeIdentity(root, setupConfig.productName);
    const licenseUpdated = applyLicenseFromConfig(root, setupConfig, null);
    if (readmeUpdated) {
      console.log("✓ Updated README.md");
    }
    if (licenseUpdated) {
      console.log("✓ Updated LICENSE and package.json (license)");
    }
  }

  if (setupConfig) {
    await bootstrapClerkConvex(root, setupConfig, interactive);
  }

  const generateCode = await runGenerate();
  if (generateCode !== 0 && isConvexLinked(root)) {
    console.error(
      "\nSetup incomplete — `bun scripts/generate.ts` failed while Convex is linked. Fix errors above, then re-run `bun run setup`.",
    );
    process.exit(generateCode);
  }

  const convexSkillsCode = await runConvexAgentSkillsIfNeeded(root);
  if (convexSkillsCode !== 0) {
    console.warn(
      "○ Convex agent skills not installed (optional). Retry: bunx convex ai-files install",
    );
  }

  const clerkSkillsCode = await runClerkAgentSkillsIfNeeded(root);
  if (clerkSkillsCode !== 0) {
    console.warn(
      "○ Clerk agent skills not installed (optional). Retry: bunx skills add clerk/skills -y -a cursor --skill clerk-react-patterns --skill clerk-testing --skill clerk-backend-api",
    );
  }

  console.log("\nReadiness");
  const readinessCode = runReadiness(root);
  if (readinessCode !== 0) {
    console.error("\nSetup incomplete — fix blocking items above, then re-run `bun run setup`.");
    process.exit(readinessCode);
  }

  if (setupConfig && interactive) {
    await bootstrapCiSecrets(root, setupConfig);
    const vercelToken = await bootstrapVercel(root, setupConfig, github);
    await bootstrapProduction(root, setupConfig, { vercelToken: vercelToken ?? undefined });
  }

  console.log("\n✓ Setup complete — continue with docs/getting-started.md");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
