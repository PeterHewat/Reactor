import { expect, test } from "@playwright/test";
import { HomePage } from "./pom/HomePage";

test.describe("Home smoke", () => {
  test("renders placeholder and is visible", async ({ page }) => {
    const home = new HomePage(page);
    await home.gotoBlank();
    await home.mountPlaceholder();
    const visible = await home.isReadyVisible();
    expect(visible).toBe(true);
  });
});
