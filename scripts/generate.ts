#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Runs codegen: routes (always), Convex (when linked).
 */
import { resolve } from "node:path";
import { hasConvexGenerated, isConvexLinked } from "./lib/convex-link";

const root = resolve(import.meta.dir, "..");
const linked = isConvexLinked(root);

type Step = {
  name: string;
  command: string[];
};

const steps: Step[] = [
  {
    name: "routes",
    command: ["bun", "scripts/generate-routes.ts"],
  },
  ...(linked
    ? [
        {
          name: "convex",
          command: ["bun", "scripts/generate-convex.ts"],
        } satisfies Step,
      ]
    : []),
];

/**
 * Runs a codegen subprocess from the repo root.
 *
 * @param step - Step name and command
 * @returns Exit code (0 = success)
 */
async function runStep(step: Step): Promise<number> {
  console.log(`\n→ ${step.command.join(" ")}`);
  const proc = Bun.spawn(step.command, {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

if (!linked) {
  console.log("○ generate:convex skipped (Convex not linked — docs/getting-started.md)");
}

for (const step of steps) {
  const code = await runStep(step);
  if (code !== 0) {
    if (step.name === "convex" && hasConvexGenerated(root)) {
      console.warn(
        "○ generate:convex failed — keeping existing convex/_generated (fix dashboard env and re-run)",
      );
      continue;
    }
    process.exit(code);
  }
}

console.log("\n✓ generate complete");
