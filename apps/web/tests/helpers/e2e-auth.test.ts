import { afterEach, describe, expect, it } from "vitest";
import {
  clerkPublishableKeyForE2E,
  getTasksE2EConfigIssues,
  isPlaywrightUiOnly,
  isTasksE2EConfigured,
} from "./e2e-auth";

const ENV_KEYS = [
  "CLERK_PUBLISHABLE_KEY",
  "VITE_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "E2E_CLERK_USER_EMAIL",
  "VITE_CONVEX_URL",
  "PLAYWRIGHT_UI_ONLY",
] as const;

function setValidE2EEnv(): void {
  process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_unitfixturenotreal0001";
  process.env.CLERK_SECRET_KEY = "sk_test_clerk_realistic_dummy_0001";
  process.env.E2E_CLERK_USER_EMAIL = "e2e.test@example.org";
  process.env.VITE_CONVEX_URL = "https://happy-animal-123.convex.cloud";
}

describe("e2e-auth", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("reports placeholder and production key issues", () => {
    process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_your-key-here";
    process.env.CLERK_SECRET_KEY = "dev-local-fixture-not-real";
    process.env.E2E_CLERK_USER_EMAIL = "e2e.test@your-apex-domain";
    process.env.VITE_CONVEX_URL = "https://your-project.convex.cloud";

    const issues = getTasksE2EConfigIssues();
    expect(issues.some((issue) => issue.includes("VITE_CLERK_PUBLISHABLE_KEY"))).toBe(true);
    expect(issues.some((issue) => issue.includes("CLERK_SECRET_KEY"))).toBe(true);
    expect(issues.some((issue) => issue.includes("VITE_CONVEX_URL"))).toBe(true);
    expect(issues.some((issue) => issue.includes("E2E_CLERK_USER_EMAIL"))).toBe(true);
    expect(isTasksE2EConfigured()).toBe(false);
  });

  it("accepts valid development env", () => {
    setValidE2EEnv();
    expect(getTasksE2EConfigIssues()).toEqual([]);
    expect(isTasksE2EConfigured()).toBe(true);
  });

  it("prefers CLERK_PUBLISHABLE_KEY over VITE_*", () => {
    process.env.CLERK_PUBLISHABLE_KEY = "pk_test_override";
    process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_other";
    expect(clerkPublishableKeyForE2E()).toBe("pk_test_override");
  });

  it("honors PLAYWRIGHT_UI_ONLY override", () => {
    setValidE2EEnv();
    process.env.PLAYWRIGHT_UI_ONLY = "1";
    expect(isPlaywrightUiOnly()).toBe(true);
    process.env.PLAYWRIGHT_UI_ONLY = "0";
    expect(isPlaywrightUiOnly()).toBe(false);
  });
});
