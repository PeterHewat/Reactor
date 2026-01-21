import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearTranslations,
  DEFAULT_LOCALE,
  flattenTranslations,
  getBrowserLocale,
  getTranslations,
  initializeI18n,
  interpolate,
  registerTranslations,
  SUPPORTED_LOCALES,
  t,
  useI18nStore,
} from "./i18n";

describe("i18n Integration", () => {
  beforeEach(() => {
    // Reset store to default state
    useI18nStore.setState({ locale: DEFAULT_LOCALE });

    // Clear localStorage
    localStorage.clear();

    // Clear translations
    clearTranslations();

    // Register test translations
    registerTranslations("en", {
      common: {
        hello: "Hello",
        greeting: "Hello, {{name}}!",
        items: "You have {{count}} items",
      },
      nested: {
        deep: {
          value: "Deep nested value",
        },
      },
    });

    registerTranslations("es", {
      common: {
        hello: "Hola",
        greeting: "¡Hola, {{name}}!",
        items: "Tienes {{count}} artículos",
      },
      nested: {
        deep: {
          value: "Valor profundamente anidado",
        },
      },
    });
  });

  afterEach(() => {
    clearTranslations();
    vi.restoreAllMocks();
  });

  describe("initializeI18n", () => {
    it("uses browser locale when no stored preference", () => {
      // Mock navigator.language to Spanish
      vi.stubGlobal("navigator", { language: "es-ES" });

      initializeI18n();

      expect(useI18nStore.getState().locale).toBe("es");
    });

    it("falls back to default locale for unsupported browser locale", () => {
      // Mock navigator.language to unsupported locale
      vi.stubGlobal("navigator", { language: "fr-FR" });

      initializeI18n();

      expect(useI18nStore.getState().locale).toBe(DEFAULT_LOCALE);
    });

    it("respects stored preference over browser locale", () => {
      // Store English preference
      localStorage.setItem("i18n-storage", JSON.stringify({ state: { locale: "en" }, version: 0 }));

      // Mock navigator.language to Spanish
      vi.stubGlobal("navigator", { language: "es-ES" });

      initializeI18n();

      // Should use stored preference (en), not browser locale (es)
      expect(useI18nStore.getState().locale).toBe("en");
    });
  });

  describe("Translation workflow", () => {
    it("translates keys in current locale", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("common.hello")).toBe("Hello");

      useI18nStore.setState({ locale: "es" });
      expect(t("common.hello")).toBe("Hola");
    });

    it("interpolates variables correctly", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("common.greeting", { name: "World" })).toBe("Hello, World!");

      useI18nStore.setState({ locale: "es" });
      expect(t("common.greeting", { name: "Mundo" })).toBe("¡Hola, Mundo!");
    });

    it("interpolates numeric variables", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("common.items", { count: 5 })).toBe("You have 5 items");
    });

    it("falls back to English for missing translations", () => {
      // Add English-only key
      registerTranslations("en", { english: { only: "English only text" } });

      useI18nStore.setState({ locale: "es" });
      expect(t("english.only")).toBe("English only text");
    });

    it("returns key when translation not found in any locale", () => {
      expect(t("nonexistent.key")).toBe("nonexistent.key");
    });

    it("allows locale override in t function", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("common.hello", undefined, "es")).toBe("Hola");
    });
  });

  describe("flattenTranslations", () => {
    it("flattens nested objects to dot notation", () => {
      const nested = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };

      const flattened = flattenTranslations(nested);
      expect(flattened["level1.level2.level3"]).toBe("value");
    });

    it("handles mixed nesting levels", () => {
      const mixed = {
        shallow: "shallow value",
        deep: {
          nested: "nested value",
        },
      };

      const flattened = flattenTranslations(mixed);
      expect(flattened["shallow"]).toBe("shallow value");
      expect(flattened["deep.nested"]).toBe("nested value");
    });

    it("handles empty objects", () => {
      const flattened = flattenTranslations({});
      expect(Object.keys(flattened)).toHaveLength(0);
    });
  });

  describe("registerTranslations", () => {
    it("merges translations for same locale", () => {
      registerTranslations("en", { first: { key: "First" } });
      registerTranslations("en", { second: { key: "Second" } });

      const translations = getTranslations("en");
      expect(translations["first.key"]).toBe("First");
      expect(translations["second.key"]).toBe("Second");
    });

    it("overwrites existing keys", () => {
      registerTranslations("en", { key: "Original" });
      registerTranslations("en", { key: "Updated" });

      const translations = getTranslations("en");
      expect(translations["key"]).toBe("Updated");
    });
  });

  describe("interpolate", () => {
    it("replaces single variable", () => {
      expect(interpolate("Hello, {{name}}!", { name: "World" })).toBe("Hello, World!");
    });

    it("replaces multiple variables", () => {
      expect(interpolate("{{greeting}}, {{name}}!", { greeting: "Hello", name: "World" })).toBe(
        "Hello, World!",
      );
    });

    it("handles numeric values", () => {
      expect(interpolate("Count: {{count}}", { count: 42 })).toBe("Count: 42");
    });

    it("preserves unmatched placeholders", () => {
      expect(interpolate("Hello, {{name}}!", {})).toBe("Hello, {{name}}!");
    });

    it("returns template unchanged when no variables provided", () => {
      expect(interpolate("Hello, World!")).toBe("Hello, World!");
    });

    it("handles zero values", () => {
      expect(interpolate("Count: {{count}}", { count: 0 })).toBe("Count: 0");
    });

    it("handles empty string values", () => {
      expect(interpolate("Name: {{name}}", { name: "" })).toBe("Name: ");
    });
  });

  describe("getBrowserLocale", () => {
    it("returns supported locale from navigator.language", () => {
      vi.stubGlobal("navigator", { language: "es-MX" });
      expect(getBrowserLocale()).toBe("es");
    });

    it("returns default locale for unsupported language", () => {
      vi.stubGlobal("navigator", { language: "de-DE" });
      expect(getBrowserLocale()).toBe(DEFAULT_LOCALE);
    });

    it("returns default locale when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(getBrowserLocale()).toBe(DEFAULT_LOCALE);
    });
  });

  describe("Store behavior", () => {
    it("persists locale to localStorage", () => {
      useI18nStore.getState().setLocale("es");

      const stored = localStorage.getItem("i18n-storage");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.locale).toBe("es");
    });

    it("notifies subscribers on locale change", () => {
      const listener = vi.fn();
      const unsubscribe = useI18nStore.subscribe(listener);

      useI18nStore.getState().setLocale("es");

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe("SUPPORTED_LOCALES", () => {
    it("contains all expected locales", () => {
      expect(SUPPORTED_LOCALES).toHaveProperty("en");
      expect(SUPPORTED_LOCALES).toHaveProperty("es");
    });

    it("has display names for all locales", () => {
      for (const [, name] of Object.entries(SUPPORTED_LOCALES)) {
        expect(typeof name).toBe("string");
        expect(name.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Locale switching workflow", () => {
    it("complete workflow: detect -> store -> translate -> switch -> translate", () => {
      // 1. Detect browser locale (mocked to Spanish)
      vi.stubGlobal("navigator", { language: "es" });
      initializeI18n();
      expect(useI18nStore.getState().locale).toBe("es");

      // 2. Translate in detected locale
      expect(t("common.hello")).toBe("Hola");

      // 3. User switches to English
      useI18nStore.getState().setLocale("en");

      // 4. Translate in new locale
      expect(t("common.hello")).toBe("Hello");

      // 5. Verify persistence
      const stored = JSON.parse(localStorage.getItem("i18n-storage")!);
      expect(stored.state.locale).toBe("en");
    });
  });
});
