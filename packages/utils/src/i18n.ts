import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Supported locales.
 * Add new locales here as they are supported.
 */
export type Locale = "en" | "es" | "fr" | "de";

/**
 * Default locale used when no preference is set.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * All supported locales with their display names.
 */
export const SUPPORTED_LOCALES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

/**
 * Translation dictionary type.
 * Nested object structure for organizing translations by namespace.
 */
export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

/**
 * Flattened translations with dot-notation keys.
 */
export type FlatTranslations = Record<string, string>;

/**
 * All translations indexed by locale.
 */
type TranslationsRegistry = Record<Locale, FlatTranslations>;

// Internal translations registry
let translationsRegistry: TranslationsRegistry = {
  en: {},
  es: {},
  fr: {},
  de: {},
};

/**
 * Flatten a nested translation dictionary into dot-notation keys.
 *
 * @param dict - Nested translation dictionary
 * @param prefix - Current key prefix
 * @returns Flattened translations
 *
 * @example
 * flattenTranslations({ common: { hello: "Hello" } })
 * // Returns: { "common.hello": "Hello" }
 */
export function flattenTranslations(dict: TranslationDictionary, prefix = ""): FlatTranslations {
  const result: FlatTranslations = {};

  for (const [key, value] of Object.entries(dict)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[fullKey] = value;
    } else {
      Object.assign(result, flattenTranslations(value, fullKey));
    }
  }

  return result;
}

/**
 * Register translations for a locale.
 * Merges with existing translations for that locale.
 *
 * @param locale - The locale to register translations for
 * @param translations - Translation dictionary (can be nested)
 *
 * @example
 * registerTranslations("en", {
 *   common: {
 *     hello: "Hello",
 *     goodbye: "Goodbye"
 *   }
 * });
 */
export function registerTranslations(locale: Locale, translations: TranslationDictionary): void {
  const flattened = flattenTranslations(translations);
  translationsRegistry[locale] = {
    ...translationsRegistry[locale],
    ...flattened,
  };
}

/**
 * Get all registered translations for a locale.
 *
 * @param locale - The locale to get translations for
 * @returns Flattened translations for the locale
 */
export function getTranslations(locale: Locale): FlatTranslations {
  return translationsRegistry[locale] ?? {};
}

/**
 * Clear all registered translations.
 * Useful for testing.
 */
export function clearTranslations(): void {
  translationsRegistry = {
    en: {},
    es: {},
    fr: {},
    de: {},
  };
}

/**
 * Interpolate variables into a translation string.
 *
 * @param template - Translation string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Interpolated string
 *
 * @example
 * interpolate("Hello, {{name}}!", { name: "World" })
 * // Returns: "Hello, World!"
 */
export function interpolate(template: string, variables?: Record<string, string | number>): string {
  if (!variables) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

interface I18nState {
  /** Current locale */
  locale: Locale;
  /** Set the current locale */
  setLocale: (locale: Locale) => void;
}

/**
 * Zustand store for i18n state management.
 *
 * Persists locale preference to localStorage.
 *
 * @example
 * const { locale, setLocale } = useI18nStore();
 * setLocale("es");
 */
const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (name: string) => store.get(name) ?? null,
    setItem: (name: string, value: string) => {
      store.set(name, value);
    },
    removeItem: (name: string) => {
      store.delete(name);
    },
  };
})();

const getStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return memoryStorage;
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: "i18n",
      storage: createJSONStorage(getStorage),
    },
  ),
);

/**
 * Translate a key to the current locale.
 *
 * @param key - Translation key (dot-notation)
 * @param variables - Optional variables for interpolation
 * @param locale - Optional locale override
 * @returns Translated string, or key if not found
 *
 * @example
 * t("common.hello") // "Hello"
 * t("common.greeting", { name: "World" }) // "Hello, World!"
 */
export function t(
  key: string,
  variables?: Record<string, string | number>,
  locale?: Locale,
): string {
  const currentLocale = locale ?? useI18nStore.getState().locale;
  const translations = getTranslations(currentLocale);
  const template = translations[key];

  if (!template) {
    // Fallback to English if translation not found
    if (currentLocale !== "en") {
      const enTranslations = getTranslations("en");
      const enTemplate = enTranslations[key];
      if (enTemplate) {
        return interpolate(enTemplate, variables);
      }
    }
    // Return key if no translation found
    return key;
  }

  return interpolate(template, variables);
}

/**
 * Get the browser's preferred locale.
 *
 * @returns The browser's preferred locale if supported, otherwise default locale
 */
export function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const browserLang = navigator.language.split("-")[0];
  if (browserLang && browserLang in SUPPORTED_LOCALES) {
    return browserLang as Locale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Initialize i18n with browser locale detection.
 * Only sets locale if user hasn't already set a preference.
 */
export function initializeI18n(): void {
  const storage = getStorage();
  const stored = storage.getItem("i18n");
  if (!stored) {
    const browserLocale = getBrowserLocale();
    useI18nStore.getState().setLocale(browserLocale);
  }
}
