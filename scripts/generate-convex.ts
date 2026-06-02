#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Regenerates `convex/_generated/` for a linked Convex deployment.
 * Fails with remediation when not linked or codegen fails (no committed stubs).
 */
import { resolve } from "node:path";
import { CONVEX_CODEGEN_FAILED_HELP, CONVEX_LINK_HELP, isConvexLinked } from "./lib/convex-link";

const root = resolve(import.meta.dir, "..");

if (!isConvexLinked(root)) {
  console.error(`\n${CONVEX_LINK_HELP}\n`);
  process.exit(1);
}

const args = ["convex", "codegen", "--typecheck", "disable"];
console.log(`generate:convex → bunx ${args.join(" ")}`);

const proc = Bun.spawn(["bunx", ...args], {
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env },
});

const code = (await proc.exited) ?? 1;
if (code !== 0) {
  console.error(`\n${CONVEX_CODEGEN_FAILED_HELP}\n`);
  process.exit(code);
}
