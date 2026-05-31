#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Checks local toolchain and env files for the Reactor starter.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function fileExists(rel: string): boolean {
  return existsSync(resolve(root, rel));
}

function readBunVersion(): string | null {
  const path = resolve(root, ".bun-version");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8").trim();
}

function readNodeVersion(): string | null {
  const path = resolve(root, ".node-version");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8").trim();
}

checks.push({
  name: "Bun",
  ok: typeof Bun !== "undefined",
  detail:
    typeof Bun !== "undefined"
      ? `bun ${Bun.version} (want ${readBunVersion() ?? ">=1.3.13"})`
      : "not running under Bun",
});

checks.push({
  name: "Node",
  ok: true,
  detail: `recommended ${readNodeVersion() ?? "24"} (see .node-version)`,
});

checks.push({
  name: "apps/web/.env.local",
  ok: fileExists("apps/web/.env.local"),
  detail: fileExists("apps/web/.env.local")
    ? "present (VITE_* for Convex/Clerk)"
    : "missing — copy apps/web/.env.example",
});

checks.push({
  name: "Root .env.local (Convex)",
  ok: fileExists(".env.local"),
  detail: fileExists(".env.local") ? "present" : "missing — run bun run dev:convex",
});

checks.push({
  name: "convex/auth.config.ts",
  ok: fileExists("convex/auth.config.ts"),
  detail: fileExists("convex/auth.config.ts")
    ? "present"
    : "copy convex/auth.config.ts.example when enabling Clerk",
});

checks.push({
  name: "Generated code",
  ok: fileExists("convex/_generated/api.d.ts") && fileExists("apps/web/src/routeTree.gen.ts"),
  detail:
    fileExists("convex/_generated/api.d.ts") && fileExists("apps/web/src/routeTree.gen.ts")
      ? "convex/_generated + routeTree.gen.ts present"
      : "run bun run generate",
});

checks.push({
  name: "Convex agent skills",
  ok: fileExists(".agents/skills/convex/SKILL.md"),
  detail: fileExists(".agents/skills/convex/SKILL.md")
    ? ".agents/ present"
    : "run bun run generate (includes npx convex ai-files install)",
});

const webEnv: Record<string, string> = {};
if (fileExists("apps/web/.env.local")) {
  const raw = readFileSync(resolve(root, "apps/web/.env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) webEnv[m[1]!] = m[2]!.trim();
  }
}

const convexUrl = webEnv.VITE_CONVEX_URL;
const clerkKey = webEnv.VITE_CLERK_PUBLISHABLE_KEY;

checks.push({
  name: "Backend slice (Convex + Clerk)",
  ok: Boolean(
    convexUrl && !convexUrl.includes("your-project") && clerkKey && !clerkKey.includes("your-key"),
  ),
  detail:
    convexUrl && clerkKey
      ? "VITE_CONVEX_URL and VITE_CLERK_PUBLISHABLE_KEY look set"
      : "set both in apps/web/.env.local for /tasks demo",
});

console.log("Reactor doctor\n");

for (const check of checks) {
  const icon = check.ok ? "✓" : "○";
  console.log(`${icon} ${check.name}: ${check.detail}`);
}

const failed = checks.filter((c) => !c.ok && c.name !== "Node");
if (failed.length > 0) {
  console.log("\nNext: README.md (Resources → getting-started if present)");
  process.exit(1);
}

console.log("\nReady: bun run dev:full → http://localhost:5173/tasks");
