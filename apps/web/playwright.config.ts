import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.e2e.ts",
  /* Auto-create missing snapshots without failing */
  updateSnapshots: "missing",
  /* Fail fast in CI to save resources */
  maxFailures: isCI ? 5 : undefined,
  /* Run tests in parallel - use fewer workers in CI to reduce resource usage */
  workers: isCI ? 2 : undefined,
  /* Retry failed tests once in CI */
  retries: isCI ? 1 : 0,
  use: {
    /* Base URL for navigation */
    baseURL,
    /* Trace only on retry to reduce storage and time */
    trace: "on-first-retry",
    /* Screenshots only on failure */
    screenshot: "only-on-failure",
    /* Disable video in CI to save time and storage; keep locally for debugging */
    video: isCI ? "off" : "retain-on-failure",
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Run local dev server before starting tests */
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  reporter: isCI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"]],
});
