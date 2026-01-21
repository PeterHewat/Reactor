import { expect, test } from "@playwright/test";
import { HomePage } from "./pom/HomePage";

/**
 * Visual regression tests for the home page.
 * These tests capture screenshots and compare them against baseline images.
 *
 * Currently skipped - enable when you have a stable UI to capture baselines.
 * To run: remove .skip and run: npx playwright test --update-snapshots
 */
test.describe.skip("Visual Regression", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test.describe("Light Mode", () => {
    test.beforeEach(async () => {
      // Ensure we're in light mode
      const isDark = await homePage.isDarkMode();
      if (isDark) {
        // Toggle until we're in light mode
        await homePage.toggleTheme();
        if (await homePage.isDarkMode()) {
          await homePage.toggleTheme();
        }
      }
    });

    test("home page matches snapshot in light mode", async ({ page }) => {
      await expect(page).toHaveScreenshot("home-light.png", {
        fullPage: true,
        animations: "disabled",
      });
    });

    test("header controls match snapshot in light mode", async () => {
      const header = homePage.page.locator("header");
      await expect(header).toHaveScreenshot("header-light.png", {
        animations: "disabled",
      });
    });
  });

  test.describe("Dark Mode", () => {
    test.beforeEach(async () => {
      // Theme cycles: light -> dark -> system -> light
      // Toggle until we reach dark mode (aria-label contains "Dark")
      let attempts = 0;
      while (attempts < 3) {
        const label = await homePage.themeToggle.getAttribute("aria-label");
        if (label?.includes("Dark")) break;
        await homePage.toggleTheme();
        attempts++;
      }
    });

    test("home page matches snapshot in dark mode", async ({ page }) => {
      await expect(page).toHaveScreenshot("home-dark.png", {
        fullPage: true,
        animations: "disabled",
      });
    });

    test("header controls match snapshot in dark mode", async () => {
      const header = homePage.page.locator("header");
      await expect(header).toHaveScreenshot("header-dark.png", {
        animations: "disabled",
      });
    });
  });

  test.describe("Spanish Locale", () => {
    test.beforeEach(async () => {
      await homePage.selectLanguage("Español");
    });

    test("home page matches snapshot in Spanish", async ({ page }) => {
      await expect(page).toHaveScreenshot("home-spanish.png", {
        fullPage: true,
        animations: "disabled",
      });
    });
  });

  test.describe("Responsive Design", () => {
    test("home page matches snapshot on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page).toHaveScreenshot("home-mobile.png", {
        fullPage: true,
        animations: "disabled",
      });
    });

    test("home page matches snapshot on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page).toHaveScreenshot("home-tablet.png", {
        fullPage: true,
        animations: "disabled",
      });
    });
  });
});
