import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { isTasksE2EConfigured } from "./helpers/e2e-auth";
import { TasksPage } from "./pom/TasksPage";

const configured = isTasksE2EConfigured();
const requireSecrets = process.env.E2E_SMOKE_REQUIRE_SECRETS === "1";

test.describe("Tasks smoke (Convex + Clerk)", () => {
  test.skip(
    !configured && !requireSecrets,
    "Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, VITE_CONVEX_URL, and VITE_CLERK_PUBLISHABLE_KEY — see docs/development.md#e2e-smoke-tasks",
  );

  test.beforeAll(() => {
    if (requireSecrets && !configured) {
      throw new Error(
        "E2E_SMOKE_REQUIRE_SECRETS=1 but Clerk/Convex env is missing — configure GitHub Actions secrets (docs/ci-cd.md)",
      );
    }
  });

  test("sign in, create, toggle complete, delete", async ({ page }) => {
    const tasks = new TasksPage(page);
    const title = `E2E smoke ${Date.now()}`;

    await page.goto("/");
    await clerk.signIn({
      page,
      emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
    });

    await tasks.goto();
    await tasks.waitForReady();

    await tasks.createTask(title);
    const row = tasks.taskRow(title);
    await expect(row).toBeVisible();

    await tasks.toggleTask(title);
    await expect(row.locator("span.line-through")).toBeVisible();

    await tasks.deleteTask(title);
    await expect(row).toHaveCount(0);
  });
});
