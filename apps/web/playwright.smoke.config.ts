import { defineConfig, devices } from "@playwright/test";
import { clerkPublishableKeyForE2E } from "./tests/helpers/e2e-auth";
import { loadEnvFile } from "./tests/helpers/load-env-file";

const webRoot = import.meta.dirname;
loadEnvFile(webRoot, ".env.local");
loadEnvFile(webRoot, ".env.e2e.local");

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const clerkPublishableKey = clerkPublishableKeyForE2E();
const convexUrl = process.env.VITE_CONVEX_URL ?? "";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.smoke.e2e.ts",
  workers: 1,
  fullyParallel: false,
  maxFailures: isCI ? 3 : undefined,
  retries: isCI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: isCI ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "clerk setup",
      testMatch: /clerk\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["clerk setup"],
    },
  ],
  webServer: {
    command: "bun run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_CONVEX_URL: convexUrl,
      VITE_CLERK_PUBLISHABLE_KEY: clerkPublishableKey ?? "",
      ...(clerkPublishableKey ? { CLERK_PUBLISHABLE_KEY: clerkPublishableKey } : {}),
    },
  },
  reporter: isCI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report-smoke" }]]
    : [["list"]],
});
