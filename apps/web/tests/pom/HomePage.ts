import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Home page.
 * Provides methods to interact with and verify the home page elements.
 */
export class HomePage {
  readonly page: Page;

  // Header elements
  readonly languageSwitcher: Locator;
  readonly themeToggle: Locator;

  // Main content elements
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly githubLink: Locator;

  // Features section
  readonly featuresTitle: Locator;
  readonly featuresList: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.languageSwitcher = page.getByRole("combobox", { name: /select language/i });
    this.themeToggle = page.getByRole("button", { name: /toggle theme/i });

    // Main content
    this.title = page.getByRole("heading", { level: 1 });
    this.subtitle = page.locator("main p").first();
    this.githubLink = page.getByRole("link", { name: /github/i });

    // Features section
    this.featuresTitle = page.getByRole("heading", { level: 2 });
    this.featuresList = page.locator("main ul");
  }

  /**
   * Navigate to the home page.
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Get the current title text.
   */
  async getTitleText(): Promise<string> {
    return (await this.title.textContent()) ?? "";
  }

  /**
   * Get the current subtitle text.
   */
  async getSubtitleText(): Promise<string> {
    return (await this.subtitle.textContent()) ?? "";
  }

  /**
   * Get the features section title text.
   */
  async getFeaturesTitleText(): Promise<string> {
    return (await this.featuresTitle.textContent()) ?? "";
  }

  /**
   * Get all feature items text.
   */
  async getFeatureItems(): Promise<string[]> {
    const items = await this.featuresList.locator("li").all();
    return Promise.all(items.map((item) => item.textContent().then((t) => t ?? "")));
  }

  /**
   * Click the theme toggle button.
   */
  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  /**
   * Check if dark mode is active.
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator("html");
    const classList = await html.getAttribute("class");
    return classList?.includes("dark") ?? false;
  }

  /**
   * Get the current theme mode from the toggle button label.
   */
  async getCurrentThemeLabel(): Promise<string> {
    return (await this.themeToggle.textContent()) ?? "";
  }

  /**
   * Select a language from the language switcher.
   */
  async selectLanguage(language: string): Promise<void> {
    await this.languageSwitcher.selectOption({ label: language });
  }

  /**
   * Get the currently selected language.
   */
  async getSelectedLanguage(): Promise<string> {
    return await this.languageSwitcher.inputValue();
  }

  /**
   * Wait for the page to be fully loaded.
   */
  async waitForLoad(): Promise<void> {
    await this.title.waitFor({ state: "visible" });
  }
}
