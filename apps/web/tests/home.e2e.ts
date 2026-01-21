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
      // Theme cycles: light -> dark -> system -> light
      // First, ensure we're in a known state by toggling until we reach light mode
      // (identified by aria-label containing "Light")
      let attempts = 0;
      while (attempts < 3) {
        const label = await homePage.themeToggle.getAttribute("aria-label");
        if (label?.includes("Light")) break;
        await homePage.toggleTheme();
        attempts++;
      }

      // Now we should be in light mode
      expect(await homePage.isDarkMode()).toBe(false);

      // Toggle to dark mode
      await homePage.toggleTheme();
      expect(await homePage.isDarkMode()).toBe(true);

      // Toggle to system mode (which follows OS preference)
      await homePage.toggleTheme();
      // System mode result depends on OS preference, just verify toggle works
      const label = await homePage.themeToggle.getAttribute("aria-label");
      expect(label).toContain("System");
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
