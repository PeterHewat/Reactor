import { expect, test } from "@playwright/test";
import { PRODUCT_NAME } from "@repo/config/product";
import { HomePage } from "./pom/HomePage";

test.describe("Routing", () => {
  test("home page loads at /", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.waitForLoad();
    await expect(home.title).toHaveText(PRODUCT_NAME);
  });

  test("unknown path shows 404 copy", async ({ page }) => {
    await page.goto("/not-a-real-route");
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });
});
