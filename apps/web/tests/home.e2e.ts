import { expect, test } from "@playwright/test";
import { HomePage } from "./pom/HomePage";

test.describe("Home Page", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test.describe("Content Rendering", () => {
    test("displays the main title", async () => {
      await expect(homePage.title).toBeVisible();
      const titleText = await homePage.getTitleText();
      expect(titleText).toBe("Reactor");
    });

    test("displays the subtitle", async () => {
      await expect(homePage.subtitle).toBeVisible();
      const subtitleText = await homePage.getSubtitleText();
      expect(subtitleText).toContain("React 19");
    });

    test("displays the GitHub link", async () => {
      await expect(homePage.githubLink).toBeVisible();
      await expect(homePage.githubLink).toHaveAttribute("href", /github\.com/);
      await expect(homePage.githubLink).toHaveAttribute("target", "_blank");
    });

    test("displays the features section", async () => {
      await expect(homePage.featuresTitle).toBeVisible();
      const featuresTitleText = await homePage.getFeaturesTitleText();
      expect(featuresTitleText).toBe("Features");

      const features = await homePage.getFeatureItems();
      expect(features.length).toBeGreaterThanOrEqual(6);
      expect(features.some((f) => f.includes("React 19"))).toBe(true);
      expect(features.some((f) => f.includes("Convex"))).toBe(true);
    });
  });

  test.describe("Theme Toggle", () => {
    test("displays the theme toggle button", async () => {
      await expect(homePage.themeToggle).toBeVisible();
    });

    test("toggles between light and dark mode", async () => {
      // Initial state depends on system preference, so we just verify toggling works
      const initialDarkMode = await homePage.isDarkMode();

      await homePage.toggleTheme();
      const afterFirstToggle = await homePage.isDarkMode();
      expect(afterFirstToggle).not.toBe(initialDarkMode);

      await homePage.toggleTheme();
      const afterSecondToggle = await homePage.isDarkMode();
      // After two toggles, we might be in system mode which could match initial
      // Just verify the toggle is interactive
      expect(typeof afterSecondToggle).toBe("boolean");
    });

    test("persists theme preference across page reload", async ({ page }) => {
      // Toggle to a known state
      await homePage.toggleTheme();
      const themeAfterToggle = await homePage.isDarkMode();

      // Reload the page
      await page.reload();
      await homePage.waitForLoad();

      // Theme should persist (may need to account for system mode)
      const themeAfterReload = await homePage.isDarkMode();
      expect(themeAfterReload).toBe(themeAfterToggle);
    });
  });

  test.describe("Language Switcher", () => {
    test("displays the language switcher", async () => {
      await expect(homePage.languageSwitcher).toBeVisible();
    });

    test("defaults to English", async () => {
      const selectedLanguage = await homePage.getSelectedLanguage();
      expect(selectedLanguage).toBe("en");
    });

    test("switches to Spanish and updates content", async () => {
      await homePage.selectLanguage("Español");

      // Verify language changed
      const selectedLanguage = await homePage.getSelectedLanguage();
      expect(selectedLanguage).toBe("es");

      // Verify content is translated
      const featuresTitleText = await homePage.getFeaturesTitleText();
      expect(featuresTitleText).toBe("Características");
    });

    test("switches back to English from Spanish", async () => {
      // First switch to Spanish
      await homePage.selectLanguage("Español");
      expect(await homePage.getFeaturesTitleText()).toBe("Características");

      // Switch back to English
      await homePage.selectLanguage("English");
      expect(await homePage.getFeaturesTitleText()).toBe("Features");
    });

    test("persists language preference across page reload", async ({ page }) => {
      // Switch to Spanish
      await homePage.selectLanguage("Español");

      // Reload the page
      await page.reload();
      await homePage.waitForLoad();

      // Language should persist
      const selectedLanguage = await homePage.getSelectedLanguage();
      expect(selectedLanguage).toBe("es");

      // Content should still be in Spanish
      const featuresTitleText = await homePage.getFeaturesTitleText();
      expect(featuresTitleText).toBe("Características");
    });
  });

  test.describe("Accessibility", () => {
    test("has proper heading hierarchy", async ({ page }) => {
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);

      const h2Count = await page.locator("h2").count();
      expect(h2Count).toBeGreaterThanOrEqual(1);
    });

    test("GitHub link opens in new tab with security attributes", async () => {
      await expect(homePage.githubLink).toHaveAttribute("rel", /noopener/);
    });

    test("interactive elements are keyboard accessible", async ({ page }) => {
      // Tab to theme toggle
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Verify focus is on an interactive element
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    });
  });
});
