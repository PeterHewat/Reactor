/* eslint-disable no-console -- CLI output */

/**
 * Prints a deferred manual checklist (setup continues; complete before go-live).
 *
 * @param title - Short action title
 * @param steps - Ordered instructions
 */
export function printManualAction(title: string, steps: string[]): void {
  console.log(`\n→ Follow up: ${title}`);
  for (const step of steps) {
    console.log(`  • ${step}`);
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
