import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import {
  clerkPublishableKeyForE2E,
  isTasksE2EConfigured,
  tasksE2EEnvMessage,
} from "./helpers/e2e-auth";

setup.describe.configure({ mode: "serial" });

setup("clerk testing token", async () => {
  if (!isTasksE2EConfigured()) {
    throw new Error(tasksE2EEnvMessage);
  }

  const publishableKey = clerkPublishableKeyForE2E();
  if (publishableKey) {
    process.env.CLERK_PUBLISHABLE_KEY = publishableKey;
  }
  await clerkSetup();
});
