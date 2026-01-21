import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearTranslations, registerTranslations, useI18nStore, type Locale } from "./i18n";
import { useTranslation } from "./use-translation";

describe("useTranslation", () => {
  beforeEach(() => {
    // Reset i18n store to default state
    useI18nStore.setState({ locale: "en" });

    // Clear and register test translations
    clearTranslations();
    registerTranslations("en", {
      common: {
        hello: "Hello",
        greeting: "Hello, {{name}}!",
        count: "You have {{count}} items",
      },
      nested: {
        deep: {
          key: "Deep value",
        },
      },
    });
    registerTranslations("es", {
      common: {
        hello: "Hola",
        greeting: "¡Hola, {{name}}!",
        count: "Tienes {{count}} artículos",
      },
      nested: {
        deep: {
          key: "Valor profundo",
        },
      },
    });
  });

  afterEach(() => {
    clearTranslations();
    vi.restoreAllMocks();
  });

  describe("locale", () => {
    it("returns the current locale from the store", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.locale).toBe("en");
    });

    it("updates when the store locale changes", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.locale).toBe("en");

      act(() => {
        useI18nStore.getState().setLocale("es");
      });

      expect(result.current.locale).toBe("es");
    });
  });

  describe("setLocale", () => {
    it("updates the locale in the store", () => {
      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.setLocale("es");
      });

      expect(useI18nStore.getState().locale).toBe("es");
      expect(result.current.locale).toBe("es");
    });

    it("is stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useTranslation());
      const setLocale1 = result.current.setLocale;

      rerender();

      expect(result.current.setLocale).toBe(setLocale1);
    });
  });

  describe("t (translate function)", () => {
    it("translates a simple key", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("common.hello")).toBe("Hello");
    });

    it("translates a nested key", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("nested.deep.key")).toBe("Deep value");
    });

    it("interpolates variables", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("common.greeting", { name: "World" })).toBe("Hello, World!");
    });

    it("interpolates numeric variables", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("common.count", { count: 5 })).toBe("You have 5 items");
    });

    it("returns the key if translation is not found", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
    });

    it("falls back to English when translation is missing in current locale", () => {
      // Add a key only in English
      registerTranslations("en", { english: { only: "English only" } });

      const { result } = renderHook(() => useTranslation());

      act(() => {
        result.current.setLocale("es");
      });

      expect(result.current.t("english.only")).toBe("English only");
    });

    it("updates translations when locale changes", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("common.hello")).toBe("Hello");

      act(() => {
        result.current.setLocale("es");
      });

      expect(result.current.t("common.hello")).toBe("Hola");
    });

    it("is recreated when locale changes (for memoization)", () => {
      const { result } = renderHook(() => useTranslation());
      const t1 = result.current.t;

      act(() => {
        result.current.setLocale("es");
      });

      // t function should be recreated since it depends on locale
      expect(result.current.t).not.toBe(t1);
    });
  });

  describe("re-rendering behavior", () => {
    it("re-renders when locale changes via store", () => {
      const renderCount = { current: 0 };

      const { result } = renderHook(() => {
        renderCount.current++;
        return useTranslation();
      });

      expect(renderCount.current).toBe(1);

      act(() => {
        useI18nStore.getState().setLocale("es");
      });

      // Should have re-rendered
      expect(renderCount.current).toBe(2);
      expect(result.current.locale).toBe("es");
    });

    it("does not re-render when locale is set to the same value", () => {
      const renderCount = { current: 0 };

      renderHook(() => {
        renderCount.current++;
        return useTranslation();
      });

      expect(renderCount.current).toBe(1);

      act(() => {
        useI18nStore.getState().setLocale("en"); // Same as current
      });

      // Zustand should not trigger re-render for same value
      expect(renderCount.current).toBe(1);
    });
  });

  describe("multiple hooks", () => {
    it("all hooks update when locale changes", () => {
      const { result: result1 } = renderHook(() => useTranslation());
      const { result: result2 } = renderHook(() => useTranslation());

      expect(result1.current.locale).toBe("en");
      expect(result2.current.locale).toBe("en");

      act(() => {
        result1.current.setLocale("es");
      });

      expect(result1.current.locale).toBe("es");
      expect(result2.current.locale).toBe("es");
    });
  });

  describe("edge cases", () => {
    it("handles empty variables object", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("common.hello", {})).toBe("Hello");
    });

    it("preserves unmatched placeholders", () => {
      const { result } = renderHook(() => useTranslation());
      expect(result.current.t("common.greeting", {})).toBe("Hello, {{name}}!");
    });

    it("handles switching between all supported locales", () => {
      const { result } = renderHook(() => useTranslation());
      const locales: Locale[] = ["en", "es"];

      for (const locale of locales) {
        act(() => {
          result.current.setLocale(locale);
        });
        expect(result.current.locale).toBe(locale);
      }
    });
  });
});
