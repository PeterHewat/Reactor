#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * First-run setup: copy env templates, optional repo URL substitution, generate, doctor.
 *
 * @example
 * bun run setup
 * bun run setup -- --repo https://github.com/acme/my-app --yes
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as readline from "node:readline/promises";
import { isConvexLinked } from "./lib/convex-link";

const root = resolve(import.meta.dir, "..");

const DEFAULT_REPO_PLACEHOLDER = "https://github.com/YOUR_ORG/YOUR_REPO";

type Options = {
  repoUrl: string | null;
  yes: boolean;
  skipGenerate: boolean;
};

/**
 * Parses CLI flags for {@link main}.
 */
function parseArgs(argv: string[]): Options {
  let repoUrl: string | null = null;
  let yes = false;
  let skipGenerate = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--yes" || arg === "-y") {
      yes = true;
    } else if (arg === "--skip-generate") {
      skipGenerate = true;
    } else if (arg === "--repo" && argv[i + 1]) {
      repoUrl = argv[++i]!.trim();
    } else if (arg?.startsWith("--repo=")) {
      repoUrl = arg.slice("--repo=".length).trim();
    }
  }

  if (!repoUrl && process.env.GITHUB_REPOSITORY) {
    repoUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  }

  return { repoUrl, yes, skipGenerate };
}

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
 * Replaces the default GitHub URL placeholder in env file content.
 */
function applyRepoUrl(content: string, repoUrl: string): string {
  return content.replaceAll(DEFAULT_REPO_PLACEHOLDER, repoUrl);
}

/**
 * Writes dotenv content with LF line endings and a trailing newline.
 */
function writeEnvFile(relPath: string, content: string): void {
  const normalized = `${content.replace(/\r\n/g, "\n").trimEnd()}\n`;
  writeFileSync(resolve(root, relPath), normalized);
}

/**
 * Sets or updates `KEY=value` in a dotenv file.
 */
function setEnvKey(relPath: string, key: string, value: string): void {
  const path = resolve(root, relPath);
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split("\n");
  const prefix = `${key}=`;
  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith(prefix)) {
      found = true;
      return `${prefix}${value}`;
    }
    return line;
  });
  if (!found) {
    next.push(`${prefix}${value}`);
  }
  writeEnvFile(relPath, next.join("\n"));
  console.log(`✓ Set ${key} in ${relPath}`);
}

/**
 * Prompts on a TTY when {@link yes} is false.
 */
async function promptRepoUrl(yes: boolean, initial: string | null): Promise<string | null> {
  if (initial) return initial;
  if (yes || !process.stdin.isTTY) return null;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      `GitHub repo URL for UI links [${DEFAULT_REPO_PLACEHOLDER}]: `,
    );
    const trimmed = answer.trim();
    if (!trimmed || /YOUR_ORG|YOUR_REPO/i.test(trimmed)) {
      return null;
    }
    return trimmed.startsWith("http") ? trimmed : `https://github.com/${trimmed}`;
  } finally {
    rl.close();
  }
}

/**
 * Runs `bun run generate` from the repo root.
 */
/**
 * Runs `bun run generate` from the repo root.
 *
 * @returns Process exit code (0 = success)
 */
async function runGenerate(): Promise<number> {
  console.log("\n→ bun run generate");
  const proc = Bun.spawn(["bun", "run", "generate"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

/**
 * Runs `bun run doctor` from the repo root.
 *
 * @returns Process exit code (0 = success)
 */
async function runDoctor(): Promise<number> {
  console.log("\n→ bun run doctor -- --bootstrap");
  const proc = Bun.spawn(["bun", "run", "doctor", "--", "--bootstrap"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

function printNextSteps(): void {
  console.log(`
Next steps (see docs/getting-started.md):

  1. Convex     bun run dev:convex
              → links project, writes root .env.local (CONVEX_DEPLOYMENT)

  2. Web env    Set VITE_CONVEX_URL in apps/web/.env.local (Convex dashboard URL)

  3. Clerk      Create app → VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env.local
              → set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard (auth.config.ts is committed)

  4. Run        bun run dev:full  →  http://localhost:5173/tasks

  5. E2E smoke  CLERK_SECRET_KEY + E2E_CLERK_USER_EMAIL (dev user in Clerk)
              → bun run e2e:smoke  (see docs/development.md)

  6. GitHub     After CONVEX_DEPLOY_KEY: set CI_STRICT=1 (Actions → Variables)
              → docs/customize-after-fork.md §4
`);
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  console.log("Reactor setup\n");

  const createdWeb = copyTemplateIfMissing("apps/web/.env.example", "apps/web/.env.local");
  copyTemplateIfMissing("apps/marketing/.env.example", "apps/marketing/.env");

  if (!existsSync(resolve(root, "convex/auth.config.ts"))) {
    copyTemplateIfMissing("convex/auth.config.ts.example", "convex/auth.config.ts");
  } else {
    console.log(
      "✓ convex/auth.config.ts present (set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard)",
    );
  }

  const repoUrl = await promptRepoUrl(opts.yes, opts.repoUrl);
  if (repoUrl) {
    if (createdWeb) {
      const webPath = resolve(root, "apps/web/.env.local");
      const raw = readFileSync(webPath, "utf8");
      writeEnvFile("apps/web/.env.local", applyRepoUrl(raw, repoUrl));
      console.log(`✓ Set VITE_REPO_URL in apps/web/.env.local`);
    } else {
      setEnvKey("apps/web/.env.local", "VITE_REPO_URL", repoUrl);
    }

    const marketingEnv = resolve(root, "apps/marketing/.env");
    if (existsSync(marketingEnv)) {
      setEnvKey("apps/marketing/.env", "PUBLIC_REPO_URL", repoUrl);
    } else if (existsSync(resolve(root, "apps/marketing/.env.example"))) {
      copyTemplateIfMissing("apps/marketing/.env.example", "apps/marketing/.env");
      setEnvKey("apps/marketing/.env", "PUBLIC_REPO_URL", repoUrl);
    }
  }

  if (!opts.skipGenerate) {
    const generateCode = await runGenerate();
    if (generateCode !== 0 && isConvexLinked(root)) {
      console.error(
        "\nSetup incomplete — `bun run generate` failed while Convex is linked. Fix errors above, then re-run `bun run setup`.",
      );
      process.exit(generateCode);
    }
  }

  const doctorCode = await runDoctor();
  if (doctorCode !== 0) {
    console.error("\nSetup incomplete — fix doctor failures above, then re-run `bun run setup`.");
    process.exit(doctorCode);
  }

  printNextSteps();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
