#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Regenerates TanStack Router route tree; restores the previous file if generation fails.
 */
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const routeTree = resolve(root, "apps/web/src/routeTree.gen.ts");
const backup = `${routeTree}.bak`;

if (existsSync(routeTree)) {
  copyFileSync(routeTree, backup);
}

console.log("generate:routes → bun run --filter @repo/web generate:routes");

const proc = Bun.spawn(["bun", "run", "--filter", "@repo/web", "generate:routes"], {
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
});

const code = (await proc.exited) ?? 1;

if (code !== 0 && existsSync(backup)) {
  copyFileSync(backup, routeTree);
  console.warn("generate:routes failed — restored previous routeTree.gen.ts");
}

if (existsSync(backup)) {
  unlinkSync(backup);
}

process.exit(code);
