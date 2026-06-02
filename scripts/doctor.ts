#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Checks local toolchain, env files, and generated code.
 *
 * @example
 * bun scripts/doctor.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isConvexLinked } from "./lib/convex-link";
import { isPlaceholderEnvValue, isRealConvexDeployment } from "../packages/config/env-placeholders";

const root = resolve(import.meta.dir, "..");

type Check = {
  name: string;
  ok: boolean;
  detail: string;
  remediation?: string;
  /** Only fails once Convex is linked (after Clerk + dashboard env). */
  deferUntilConvex?: boolean;
  optional?: boolean;
};

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

/**
 * Parses a Node-style semver string to its major version.
 */
function parseNodeMajor(version: string): number | null {
  const m = version.replace(/^v/, "").match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

const checks: Check[] = [];

checks.push({
  name: "Bun",
  ok: typeof Bun !== "undefined",
  detail:
    typeof Bun !== "undefined"
      ? `bun ${Bun.version} (want ${readBunVersion() ?? ">=1.3.13"})`
      : "not running under Bun",
  remediation: "Install Bun from https://bun.sh and re-run `bun scripts/doctor.ts`",
});

const wantedNode = readNodeVersion();
const currentNodeMajor = parseNodeMajor(process.version);
const wantedNodeMajor = wantedNode ? parseNodeMajor(wantedNode) : null;
const nodeOk = !wantedNodeMajor || currentNodeMajor === wantedNodeMajor;

checks.push({
  name: "Node",
  ok: nodeOk,
  detail: nodeOk
    ? `v${currentNodeMajor ?? "?"} (want ${wantedNode ?? "24"} from .node-version)`
    : `v${currentNodeMajor ?? "?"} — want ${wantedNode} from .node-version`,
  remediation: nodeOk
    ? undefined
    : "Install the Node version in .node-version (see engines in package.json)",
});

checks.push({
  name: "apps/web/.env.local",
  ok: fileExists("apps/web/.env.local"),
  detail: fileExists("apps/web/.env.local") ? "present" : "missing",
  remediation: "bun scripts/setup.ts  # or: cp apps/web/.env.example apps/web/.env.local",
});

let convexDeployment: string | undefined;
if (fileExists(".env.local")) {
  const raw = readFileSync(resolve(root, ".env.local"), "utf8");
  const match = raw.match(/^CONVEX_DEPLOYMENT=(.+)$/m);
  convexDeployment = match?.[1]?.trim();
}

const convexLinked = isConvexLinked(root);

checks.push({
  name: "Root .env.local (Convex)",
  ok: convexLinked,
  detail: convexLinked
    ? "linked"
    : fileExists(".env.local")
      ? "present but not linked — run dev:convex"
      : "missing",
  remediation: "bun run dev:convex — docs/getting-started.md",
  deferUntilConvex: true,
});

const hasAuthConfig = fileExists("convex/auth.config.ts");
checks.push({
  name: "convex/auth.config.ts",
  ok: hasAuthConfig,
  detail: hasAuthConfig ? "present" : "missing",
  remediation: "cp convex/auth.config.ts.example convex/auth.config.ts",
});

const hasConvexGenerated = fileExists("convex/_generated/api.d.ts");
const hasRoutes = fileExists("apps/web/src/routeTree.gen.ts");

checks.push({
  name: "Generated code (routes)",
  ok: hasRoutes,
  detail: hasRoutes ? "routeTree.gen.ts present" : "missing",
  remediation: "bun scripts/generate-routes.ts",
});

checks.push({
  name: "Generated code (Convex)",
  ok: hasConvexGenerated,
  detail: hasConvexGenerated ? "convex/_generated present" : "missing",
  remediation: "bun run dev:convex  # or: bun scripts/generate-convex.ts",
  deferUntilConvex: true,
});

checks.push({
  name: "Convex agent skills",
  ok: fileExists(".agents/skills/convex/SKILL.md"),
  detail: fileExists(".agents/skills/convex/SKILL.md") ? ".agents/ present" : "missing",
  remediation: "bunx convex ai-files install",
  optional: true,
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
const backendConfigured = !isPlaceholderEnvValue(convexUrl) && !isPlaceholderEnvValue(clerkKey);

checks.push({
  name: "Backend (Convex + Clerk env)",
  ok: backendConfigured,
  detail: backendConfigured
    ? "VITE_CONVEX_URL and VITE_CLERK_PUBLISHABLE_KEY set"
    : "placeholders or missing in apps/web/.env.local",
  remediation: "docs/getting-started.md steps 2–3",
  deferUntilConvex: true,
});

if (convexDeployment && !isRealConvexDeployment(convexDeployment)) {
  checks.push({
    name: "CONVEX_DEPLOYMENT",
    ok: false,
    detail: "root .env.local still has a template value",
    remediation: "bun run dev:convex",
    deferUntilConvex: true,
  });
}

const e2eEmail = process.env.E2E_CLERK_USER_EMAIL;
const e2eSecret = process.env.CLERK_SECRET_KEY;
checks.push({
  name: "E2E smoke (optional)",
  ok: Boolean(e2eSecret && e2eEmail),
  detail: e2eSecret && e2eEmail ? "CLERK_SECRET_KEY + E2E_CLERK_USER_EMAIL set" : "not configured",
  remediation: "apps/web/.env.local.e2e.example and docs/development.md#e2e-smoke-tasks",
  optional: true,
});

const expectConvex = convexLinked;

/**
 * Whether a failed check should exit non-zero.
 */
function isBlocking(check: Check): boolean {
  if (check.ok || check.optional) {
    return false;
  }
  if (check.deferUntilConvex && !expectConvex) {
    return false;
  }
  return true;
}

console.log("Reactor doctor\n");

for (const check of checks) {
  const icon = check.ok ? "✓" : "○";
  console.log(`${icon} ${check.name}: ${check.detail}`);
  if (!check.ok && check.remediation) {
    console.log(`    → ${check.remediation}`);
  }
}

const blocking = checks.filter(isBlocking);
if (blocking.length > 0) {
  console.log("\nDocs: docs/getting-started.md");
  process.exit(1);
}
