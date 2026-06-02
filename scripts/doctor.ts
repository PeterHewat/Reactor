#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Checks local toolchain and env files for the Reactor starter.
 *
 * @example
 * bun scripts/doctor.ts
 * bun scripts/doctor.ts -- --strict
 * bun scripts/doctor.ts -- --bootstrap
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
  bootstrapOnly?: boolean;
  strictOnly?: boolean;
};

type Mode = "default" | "bootstrap" | "strict";

/**
 * Parses `doctor` CLI flags.
 */
function parseMode(argv: string[]): Mode {
  if (argv.includes("--strict")) return "strict";
  if (argv.includes("--bootstrap")) return "bootstrap";
  return "default";
}

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

const mode = parseMode(process.argv.slice(2));
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
  detail: fileExists("apps/web/.env.local") ? "present (VITE_* for Convex/Clerk)" : "missing",
  remediation: "bun scripts/setup.ts  # or: cp apps/web/.env.example apps/web/.env.local",
  bootstrapOnly: true,
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
    ? "linked (real CONVEX_DEPLOYMENT or deploy key)"
    : fileExists(".env.local")
      ? "present but placeholder — run dev:convex to link"
      : "missing",
  remediation: "getting-started §3b: bun run dev:convex (after §2 Clerk + §3a dashboard env)",
  bootstrapOnly: true,
});

const hasAuthConfig = fileExists("convex/auth.config.ts");
checks.push({
  name: "convex/auth.config.ts",
  ok: hasAuthConfig,
  detail: hasAuthConfig ? "present (CLERK_JWT_ISSUER_DOMAIN in Convex dashboard — §3a)" : "missing",
  remediation: hasAuthConfig ? undefined : "cp convex/auth.config.ts.example convex/auth.config.ts",
  bootstrapOnly: true,
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
  detail: hasConvexGenerated
    ? "convex/_generated present"
    : "missing — typecheck and tests will fail",
  remediation: "§3b: bun run dev:convex  # or: bun scripts/generate-convex.ts (after §2–3a)",
  bootstrapOnly: true,
});

checks.push({
  name: "Convex agent skills",
  ok: fileExists(".agents/skills/convex/SKILL.md"),
  detail: fileExists(".agents/skills/convex/SKILL.md") ? ".agents/ present" : "missing",
  remediation: "bunx convex ai-files install",
  bootstrapOnly: true,
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
  name: "Backend slice (Convex + Clerk)",
  ok: backendConfigured,
  detail: backendConfigured
    ? "VITE_CONVEX_URL and VITE_CLERK_PUBLISHABLE_KEY configured"
    : "placeholders or missing in apps/web/.env.local",
  remediation:
    "§2b VITE_CLERK_PUBLISHABLE_KEY + §3c VITE_CONVEX_URL in apps/web/.env.local (getting-started)",
  strictOnly: true,
});

if (mode === "strict" && convexDeployment && !isRealConvexDeployment(convexDeployment)) {
  checks.push({
    name: "CONVEX_DEPLOYMENT",
    ok: false,
    detail: "root .env.local still has a template value",
    remediation: "bun run dev:convex",
    strictOnly: true,
  });
}

const e2eEmail = process.env.E2E_CLERK_USER_EMAIL;
const e2eSecret = process.env.CLERK_SECRET_KEY;
checks.push({
  name: "E2E smoke (optional)",
  ok: Boolean(e2eSecret && e2eEmail),
  detail: e2eSecret && e2eEmail ? "CLERK_SECRET_KEY + E2E_CLERK_USER_EMAIL set" : "not configured",
  remediation: "see apps/web/.env.local.e2e.example and docs/development.md#e2e-smoke-tasks",
  strictOnly: true,
});

/**
 * Whether a failed check should exit non-zero for the current mode.
 *
 * Bootstrap (setup): toolchain + route codegen only — Convex link and env values come next.
 */
function isBlocking(check: Check): boolean {
  if (check.ok) {
    return false;
  }
  if (check.strictOnly && mode !== "strict") {
    return false;
  }
  if (mode === "bootstrap") {
    if (check.bootstrapOnly) {
      return false;
    }
    return (
      check.name === "Bun" || check.name === "Node" || check.name === "Generated code (routes)"
    );
  }
  return true;
}

console.log(`Reactor doctor (${mode})\n`);

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

if (mode === "bootstrap") {
  console.log("\nSetup OK — next: docs/getting-started.md §2 (Clerk), then §3 (Convex)");
} else if (mode === "strict") {
  console.log("\nStrict checks passed — bun run dev:full → http://localhost:5173/tasks");
} else {
  console.log("\nReady: bun run dev:full → http://localhost:5173/tasks");
}
