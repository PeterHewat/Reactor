import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import {
  clerkPublishableKeyForE2E,
  getTasksE2EConfigIssues,
  isTasksE2EConfigured,
  tasksE2EEnvMessage,
} from "./helpers/e2e-auth";

setup.describe.configure({ mode: "serial" });

setup("clerk testing token", async () => {
  if (!isTasksE2EConfigured()) {
    const issues = getTasksE2EConfigIssues();
    throw new Error(issues.length > 0 ? issues.join(" ") : tasksE2EEnvMessage);
  }

  const publishableKey = clerkPublishableKeyForE2E();
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (publishableKey) {
    process.env.CLERK_PUBLISHABLE_KEY = publishableKey;
  }

  try {
    await clerkSetup({
      publishableKey,
      secretKey,
      dotenv: false,
    });
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status: unknown }).status
        : undefined;
    if (status === 404) {
      throw new Error(
        'Clerk testing token request failed (404). Ensure JWT template "convex" exists (Clerk dashboard → JWT templates → Convex preset, or `bun run setup`) and Development keys match — docs/setup-automation.md#clerk',
        { cause: error },
      );
    }
    throw error;
  }
});
