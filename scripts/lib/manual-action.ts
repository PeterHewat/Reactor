/* eslint-disable no-console -- CLI output */

export type ManualActionOptions = {
  /** Blocking prompt follows — use "Next" instead of "Follow up". */
  immediate?: boolean;
};

/**
 * Prints a manual checklist (deferred follow-up or immediate next step before a prompt).
 *
 * @param title - Short action title
 * @param steps - Ordered instructions
 * @param options - `immediate` when the user must act before the next prompt
 */
export function printManualAction(
  title: string,
  steps: string[],
  options?: ManualActionOptions,
): void {
  const prefix = options?.immediate ? "→" : "→ Follow up:";
  console.log(`\n${prefix} ${title}`);
  for (const step of steps) {
    console.log(`  • ${step}`);
  }
  if (options?.immediate) {
    console.log("\n  ↓ Continue at the input prompt below\n");
  }
}

/**
 * Prints a blocking manual step and exits setup (user must re-run after completing it).
 *
 * @param title - Short action title
 * @param steps - Ordered instructions
 */
export function exitWithManualAction(title: string, steps: string[]): never {
  console.log(`\n→ ACTION REQUIRED: ${title}`);
  for (const step of steps) {
    console.log(`  • ${step}`);
  }
  console.log("\nSetup paused — complete the steps above, then resume with `bun run setup`.");
  process.exit(1);
}
