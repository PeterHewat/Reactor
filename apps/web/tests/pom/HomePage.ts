import type { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly readyIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.readyIndicator = page.getByTestId("app-ready");
  }

  async gotoBlank(): Promise<void> {
    await this.page.goto("about:blank");
  }

  async mountPlaceholder(): Promise<void> {
    await this.page.setContent('<div data-testid="app-ready">Ready</div>');
  }

  async isReadyVisible(): Promise<boolean> {
    await this.readyIndicator.waitFor({ state: "visible" });
    return await this.readyIndicator.isVisible();
  }
}
