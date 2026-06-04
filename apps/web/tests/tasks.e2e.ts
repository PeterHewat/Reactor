import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { isTasksE2EConfigured, tasksE2EEnvMessage } from "./helpers/e2e-auth";
import { TasksPage } from "./pom/TasksPage";

test.describe("Tasks (Convex + Clerk)", () => {
  test.beforeAll(() => {
    if (!isTasksE2EConfigured()) {
      throw new Error(tasksE2EEnvMessage);
    }
  });

  test("sign in, create, toggle complete, delete", async ({ page }) => {
    const tasks = new TasksPage(page);
    const title = `E2E task ${Date.now()}`;

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
