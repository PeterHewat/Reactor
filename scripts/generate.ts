#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Runs codegen: routes (always), Convex (when linked), AI skills (best effort).
 * Skips unchanged steps via hash cache in `.cache/`.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONVEX_LINK_HELP, hasConvexGenerated, isConvexLinked } from "./lib/convex-link";

const root = resolve(import.meta.dir, "..");
const cacheDir = resolve(root, ".cache");
const cacheFile = resolve(cacheDir, "generate-hashes.json");
const linked = isConvexLinked(root);

type Step = {
  name: string;
  inputs: string[];
  command: string[];
  optional?: boolean;
};

const steps: Step[] = [
  {
    name: "routes",
    inputs: ["apps/web/src/routes"],
    command: ["bun", "run", "generate:routes"],
  },
  ...(linked
    ? [
        {
          name: "convex",
          inputs: ["convex", "scripts/generate-convex.ts", "scripts/lib/convex-link.ts"],
          command: ["bun", "run", "generate:convex"],
        } satisfies Step,
      ]
    : []),
  {
    name: "ai",
    inputs: ["package.json", "convex"],
    command: ["bun", "run", "generate:ai"],
    optional: true,
  },
];

/**
 * Hashes file contents for paths under the repo root (files or directories).
 */
function hashPaths(paths: string[]): string {
  const hash = createHash("sha256");

  function walk(rel: string): void {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) {
      hash.update(`missing:${rel}`);
      return;
    }
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(abs).sort()) {
        walk(`${rel}/${entry}`);
      }
      return;
    }
    hash.update(rel);
    hash.update(readFileSync(abs));
  }

  for (const rel of paths) {
    walk(rel);
  }

  return hash.digest("hex");
}

function readCache(): Record<string, string> {
  if (!existsSync(cacheFile)) {
    return {};
  }
  return JSON.parse(readFileSync(cacheFile, "utf8")) as Record<string, string>;
}

function writeCache(cache: Record<string, string>): void {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cacheFile, `${JSON.stringify(cache, null, 2)}\n`);
}

async function runStep(step: Step): Promise<number> {
  console.log(`\n→ ${step.command.join(" ")}`);
  const proc = Bun.spawn(step.command, {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

const force = process.argv.includes("--force");
const cache = readCache();

if (!linked) {
  console.log(`○ generate:convex skipped (Convex not linked)\n${CONVEX_LINK_HELP}\n`);
}

for (const step of steps) {
  const digest = hashPaths(step.inputs);
  if (!force && cache[step.name] === digest) {
    console.log(`○ generate:${step.name} skipped (unchanged)`);
    continue;
  }

  const code = await runStep(step);
  if (code !== 0) {
    if (step.optional) {
      console.warn(`○ generate:${step.name} failed (optional) — continuing`);
      continue;
    }
    if (step.name === "convex" && hasConvexGenerated(root)) {
      console.warn(
        "○ generate:convex failed — keeping existing convex/_generated (fix dashboard env and re-run)",
      );
      continue;
    }
    process.exit(code);
  }
  cache[step.name] = digest;
  writeCache(cache);
}

console.log("\n✓ generate complete");
