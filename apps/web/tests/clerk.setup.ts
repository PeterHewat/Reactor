import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { clerkPublishableKeyForE2E, isTasksE2EConfigured } from "./helpers/e2e-auth";

setup.describe.configure({ mode: "serial" });

setup.skip(
  !isTasksE2EConfigured(),
  "Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, VITE_CONVEX_URL, VITE_CLERK_PUBLISHABLE_KEY — see apps/web/.env.e2e.example",
);

setup("clerk testing token", async () => {
  const publishableKey = clerkPublishableKeyForE2E();
  if (publishableKey) {
    process.env.CLERK_PUBLISHABLE_KEY = publishableKey;
  }
  await clerkSetup();
});
