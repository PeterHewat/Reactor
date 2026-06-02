#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Exits 1 when `convex/_generated/` is missing (typecheck/tests need it).
 */
import { resolve } from "node:path";
import { CONVEX_LINK_HELP, hasConvexGenerated } from "./lib/convex-link";

const root = resolve(import.meta.dir, "..");

if (hasConvexGenerated(root)) {
  process.exit(0);
}

console.error(`\n${CONVEX_LINK_HELP}\n`);
process.exit(1);
