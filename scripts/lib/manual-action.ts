/* eslint-disable no-console -- CLI output */

/**
 * Prints a manual step the user must complete (clear call to action).
 *
 * @param title - Short action title
 * @param steps - Ordered instructions
 */
export function printManualAction(title: string, steps: string[]): void {
  console.log(`\n→ ACTION REQUIRED: ${title}`);
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
  printManualAction(title, steps);
  console.log("\nSetup paused — complete the steps above, then resume with `bun run setup`.");
  process.exit(1);
}
