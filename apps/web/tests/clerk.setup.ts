import { isClerkAPIResponseError } from "@clerk/backend/errors";
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
    if (isClerkAPIResponseError(error) && error.status === 404) {
      throw new Error(
        "Clerk testing token request failed (404). Use matching Development keys from the same Clerk application — re-sync via `bun run setup` or update GitHub repository secrets (docs/ci-cd.md#repository-secrets).",
        { cause: error },
      );
    }
    throw error;
  }
});
