import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearTranslations,
  DEFAULT_LOCALE,
  flattenTranslations,
  getBrowserLocale,
  getTranslations,
  interpolate,
  registerTranslations,
  SUPPORTED_LOCALES,
  t,
  useI18nStore,
} from "./i18n";

describe("i18n utilities", () => {
  beforeEach(() => {
    // Reset store state before each test
    useI18nStore.setState({ locale: DEFAULT_LOCALE });
    // Clear translations
    clearTranslations();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("SUPPORTED_LOCALES", () => {
    it("includes English and Spanish", () => {
      expect(SUPPORTED_LOCALES.en).toBe("English");
      expect(SUPPORTED_LOCALES.es).toBe("Español");
    });
  });

  describe("flattenTranslations", () => {
    it("flattens nested object to dot notation", () => {
      const nested = {
        common: {
          hello: "Hello",
          nested: {
            deep: "Deep value",
          },
        },
        simple: "Simple value",
      };

      const flattened = flattenTranslations(nested);

      expect(flattened).toEqual({
        "common.hello": "Hello",
        "common.nested.deep": "Deep value",
        simple: "Simple value",
      });
    });

    it("handles empty object", () => {
      expect(flattenTranslations({})).toEqual({});
    });

    it("handles single level object", () => {
      const single = { hello: "Hello", world: "World" };
      expect(flattenTranslations(single)).toEqual(single);
    });
  });

  describe("registerTranslations", () => {
    it("registers translations for a locale", () => {
      registerTranslations("en", { hello: "Hello" });
      expect(getTranslations("en")).toEqual({ hello: "Hello" });
    });

    it("merges with existing translations", () => {
      registerTranslations("en", { hello: "Hello" });
      registerTranslations("en", { world: "World" });
      expect(getTranslations("en")).toEqual({ hello: "Hello", world: "World" });
    });

    it("flattens nested translations", () => {
      registerTranslations("en", { common: { hello: "Hello" } });
      expect(getTranslations("en")).toEqual({ "common.hello": "Hello" });
    });
  });

  describe("interpolate", () => {
    it("replaces single variable", () => {
      expect(interpolate("Hello, {{name}}!", { name: "World" })).toBe("Hello, World!");
    });

    it("replaces multiple variables", () => {
      expect(interpolate("{{greeting}}, {{name}}!", { greeting: "Hi", name: "User" })).toBe(
        "Hi, User!",
      );
    });

    it("handles number variables", () => {
      expect(interpolate("Count: {{count}}", { count: 42 })).toBe("Count: 42");
    });

    it("keeps placeholder if variable not provided", () => {
      expect(interpolate("Hello, {{name}}!", {})).toBe("Hello, {{name}}!");
    });

    it("returns template unchanged if no variables", () => {
      expect(interpolate("Hello, World!")).toBe("Hello, World!");
    });
  });

  describe("t function", () => {
    beforeEach(() => {
      registerTranslations("en", {
        hello: "Hello",
        greeting: "Hello, {{name}}!",
      });
      registerTranslations("es", {
        hello: "Hola",
        greeting: "¡Hola, {{name}}!",
      });
    });

    it("returns translation for current locale", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("hello")).toBe("Hello");

      useI18nStore.setState({ locale: "es" });
      expect(t("hello")).toBe("Hola");
    });

    it("interpolates variables", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("greeting", { name: "World" })).toBe("Hello, World!");
    });

    it("falls back to English if translation missing", () => {
      registerTranslations("en", { onlyInEnglish: "Only in English" });
      useI18nStore.setState({ locale: "es" });
      expect(t("onlyInEnglish")).toBe("Only in English");
    });

    it("returns key if translation not found in any locale", () => {
      expect(t("nonexistent.key")).toBe("nonexistent.key");
    });

    it("accepts locale override", () => {
      useI18nStore.setState({ locale: "en" });
      expect(t("hello", undefined, "es")).toBe("Hola");
    });
  });

  describe("useI18nStore", () => {
    it("has default locale of en", () => {
      expect(useI18nStore.getState().locale).toBe("en");
    });

    it("setLocale updates locale", () => {
      useI18nStore.getState().setLocale("es");
      expect(useI18nStore.getState().locale).toBe("es");
    });
  });

  describe("getBrowserLocale", () => {
    it("returns supported locale if browser language matches", () => {
      vi.stubGlobal("navigator", { language: "es-ES" });
      expect(getBrowserLocale()).toBe("es");
    });

    it("returns default locale if browser language not supported", () => {
      vi.stubGlobal("navigator", { language: "ja-JP" });
      expect(getBrowserLocale()).toBe("en");
    });

    it("returns default locale if navigator undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(getBrowserLocale()).toBe("en");
    });
  });

  describe("persistence", () => {
    it("persists locale to localStorage", () => {
      useI18nStore.getState().setLocale("es");

      const stored = localStorage.getItem("i18n");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored ?? "{}");
      expect(parsed.state.locale).toBe("es");
    });
  });
});
