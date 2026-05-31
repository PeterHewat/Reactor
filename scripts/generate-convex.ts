#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Regenerates `convex/_generated/`. Uses linked deployment when available;
 * otherwise provisions a one-shot local deployment (CI-friendly).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const envLocal = resolve(root, ".env.local");
const hasDeployment =
  Boolean(process.env.CONVEX_DEPLOY_KEY) ||
  Boolean(process.env.CONVEX_DEPLOYMENT) ||
  existsSync(envLocal);

const args = ["convex", hasDeployment ? "codegen" : "dev", "--typecheck", "disable"];
if (!hasDeployment) {
  args.push("--once");
}

console.log(`generate:convex → bunx ${args.join(" ")}`);

const proc = Bun.spawn(["bunx", ...args], {
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
});

const code = await proc.exited;
if (code !== 0) {
  process.exit(code ?? 1);
}
