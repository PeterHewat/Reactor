import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.e2e.ts",
  /* Fail fast in CI to save resources */
  maxFailures: isCI ? 5 : undefined,
  /* Run tests in parallel - use fewer workers in CI to reduce resource usage */
  workers: isCI ? 2 : undefined,
  /* Retry failed tests once in CI */
  retries: isCI ? 1 : 0,
  use: {
    /* Trace only on retry to reduce storage and time */
    trace: "on-first-retry",
    /* Screenshots only on failure */
    screenshot: "only-on-failure",
    /* Disable video in CI to save time and storage; keep locally for debugging */
    video: isCI ? "off" : "retain-on-failure",
  },
  reporter: isCI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"]],
});
