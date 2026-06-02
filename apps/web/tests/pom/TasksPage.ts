import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the authenticated `/tasks` feature.
 */
export class TasksPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly titleInput: Locator;
  readonly addButton: Locator;
  readonly taskList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Tasks", level: 1 });
    this.titleInput = page.getByLabel(/what needs to be done/i);
    this.addButton = page.getByRole("button", { name: /add task/i });
    this.taskList = page.getByRole("list", { name: /your tasks/i });
  }

  /**
   * Navigate to the tasks page.
   */
  async goto(): Promise<void> {
    await this.page.goto("/tasks");
  }

  /**
   * Wait until the tasks panel has loaded (not auth redirect / loading).
   */
  async waitForReady(): Promise<void> {
    await this.heading.waitFor({ state: "visible" });
    await this.titleInput.waitFor({ state: "visible" });
  }

  /**
   * Create a task with the given title.
   *
   * @param title - Task title text
   */
  async createTask(title: string): Promise<void> {
    await this.titleInput.fill(title);
    await this.addButton.click();
  }

  /**
   * Locator for a task row containing the given title.
   *
   * @param title - Task title text
   */
  taskRow(title: string): Locator {
    return this.taskList.locator("li").filter({ hasText: title });
  }

  /**
   * Toggle completion for a task by title.
   *
   * @param title - Task title text
   */
  async toggleTask(title: string): Promise<void> {
    const row = this.taskRow(title);
    await row.getByRole("checkbox").click();
  }

  /**
   * Delete a task by title.
   *
   * @param title - Task title text
   */
  async deleteTask(title: string): Promise<void> {
    const row = this.taskRow(title);
    await row.getByRole("button", { name: /delete/i }).click();
  }
}
