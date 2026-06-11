import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { clerkPublishableKeyForE2E, isPlaywrightUiOnly } from "./tests/helpers/e2e-auth";

const webRoot = import.meta.dirname;

/**
 * Merges `KEY=value` lines from a dotenv file into `process.env` (does not override existing).
 *
 * @param filename - Env file name (e.g. `.env.local`)
 */
function loadEnvFile(filename: string): void {
  const path = resolve(webRoot, filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    if (process.env[key] !== undefined) continue;
    let value = m[2]!.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const clerkPublishableKey = clerkPublishableKeyForE2E();
const convexUrl =
  process.env.VITE_CONVEX_URL ?? (isPlaywrightUiOnly() ? "https://test-project.convex.cloud" : "");
const uiOnly = isPlaywrightUiOnly();

const playwrightProjects = [
  {
    name: "ui",
    testMatch: /(home|routing)\.e2e\.ts/,
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "clerk setup",
    testMatch: /clerk\.setup\.ts/,
  },
  {
    name: "tasks",
    testMatch: /tasks\.e2e\.ts/,
    use: { ...devices["Desktop Chrome"] },
    dependencies: ["clerk setup"],
  },
];

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.e2e.ts",
  updateSnapshots: "missing",
  maxFailures: isCI ? 5 : undefined,
  // workers: isCI ? 1 : undefined,
  // fullyParallel: !isCI,
  retries: isCI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: isCI ? "off" : "retain-on-failure",
  },
  projects: uiOnly
    ? playwrightProjects.filter((project) => project.name === "ui")
    : [...playwrightProjects],
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
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"]],
});
