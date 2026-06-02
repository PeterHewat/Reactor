#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * First-run setup: env templates, identity from `git remote`, generate, doctor.
 *
 * @example
 * bun scripts/setup.ts
 */
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { applyIdentity, resolveGitHubRepo } from "./lib/apply-identity";
import { isConvexLinked } from "./lib/convex-link";

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
 * Runs `bun scripts/doctor.ts` from the repo root.
 *
 * @returns Process exit code (0 = success)
 */
async function runDoctor(): Promise<number> {
  console.log("\n→ bun scripts/doctor.ts");
  const proc = Bun.spawn(["bun", "scripts/doctor.ts"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

async function main(): Promise<void> {
  console.log("Reactor setup\n");

  copyTemplateIfMissing("apps/web/.env.example", "apps/web/.env.local");
  copyTemplateIfMissing("apps/marketing/.env.example", "apps/marketing/.env.local");

  if (!existsSync(resolve(root, "convex/auth.config.ts"))) {
    copyTemplateIfMissing("convex/auth.config.ts.example", "convex/auth.config.ts");
  } else {
    console.log("✓ convex/auth.config.ts present");
  }

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
    console.log(
      "○ No GitHub remote — set VITE_REPO_URL and PUBLIC_REPO_URL in apps/web/.env.local and apps/marketing/.env.local",
    );
  }

  const generateCode = await runGenerate();
  if (generateCode !== 0 && isConvexLinked(root)) {
    console.error(
      "\nSetup incomplete — `bun scripts/generate.ts` failed while Convex is linked. Fix errors above, then re-run `bun scripts/setup.ts`.",
    );
    process.exit(generateCode);
  }

  const doctorCode = await runDoctor();
  if (doctorCode !== 0) {
    console.error(
      "\nSetup incomplete — fix doctor failures above, then re-run `bun scripts/setup.ts`.",
    );
    process.exit(doctorCode);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
