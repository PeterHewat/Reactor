#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Setup and readiness — safe to re-run anytime.
 *
 * @example
 * bun scripts/setup.ts
 */
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { applyIdentity, resolveGitHubRepo } from "./lib/apply-identity";
import { isConvexLinked } from "./lib/convex-link";
import { runReadiness } from "./lib/readiness";

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

/**
 * Installs Convex agent skills for local AI editors (best effort; optional).
 *
 * @returns Process exit code (0 = success)
 */
async function runAgentSkills(): Promise<number> {
  console.log("\n→ bunx convex ai-files install");
  const proc = Bun.spawn(["bunx", "convex", "ai-files", "install"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

async function main(): Promise<void> {
  console.log("Reactor setup\n");

  copyTemplateIfMissing("apps/web/.env.example", "apps/web/.env.local");

  const github = resolveGitHubRepo(root);
  if (github) {
    const identity = applyIdentity(root, github);
    console.log(
      `✓ Repository: ${github.repoUrl} → product name "${identity.productName}"${identity.rebranded ? "" : " (upstream template)"}`,
    );
    if (identity.changes.length > 0) {
      console.log(`✓ Updated: ${identity.changes.join(", ")}`);
    }
  } else {
    console.log("○ No GitHub remote — product name stays at template default until you add origin");
  }

  const generateCode = await runGenerate();
  if (generateCode !== 0 && isConvexLinked(root)) {
    console.error(
      "\nSetup incomplete — `bun scripts/generate.ts` failed while Convex is linked. Fix errors above, then re-run `bun scripts/setup.ts`.",
    );
    process.exit(generateCode);
  }

  const skillsCode = await runAgentSkills();
  if (skillsCode !== 0) {
    console.warn(
      "○ Convex agent skills not installed (optional). Retry: bunx convex ai-files install",
    );
  }

  console.log("\nReadiness");
  const readinessCode = runReadiness(root);
  if (readinessCode !== 0) {
    console.error(
      "\nSetup incomplete — fix blocking items above, then re-run `bun scripts/setup.ts`.",
    );
    process.exit(readinessCode);
  }

  console.log("\n✓ Setup complete — continue with docs/getting-started.md");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
