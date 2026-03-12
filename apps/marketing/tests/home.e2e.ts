import { expect, test } from "@playwright/test";

test.describe("Marketing Home Page", () => {
  test("should load the home page with correct title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Reactor - Modern Monorepo Starter");
  });

  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /build faster with reactor/i })).toBeVisible();
    await expect(page.getByText(/production-ready monorepo/i)).toBeVisible();
  });

  test("should have correct meta description", async ({ page }) => {
    await page.goto("/");

    const description = page.locator('head > meta[name="description"]').first();
    await expect(description).toHaveAttribute("content", /monorepo template/i);
  });

  test("should have a canonical URL", async ({ page }) => {
    await page.goto("/");

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\//);
  });

  test("should navigate to the blog page", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.getByRole("heading", { name: /blog/i })).toBeVisible();
  });
});
