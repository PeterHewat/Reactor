import { useCallback, useSyncExternalStore } from "react";
import { getTranslations, interpolate, useI18nStore, type Locale } from "./i18n";

/**
 * Hook return type for useTranslation.
 */
interface UseTranslationReturn {
  /** Current locale */
  locale: Locale;
  /** Set the current locale */
  setLocale: (locale: Locale) => void;
  /**
   * Translate a key to the current locale.
   *
   * @param key - Translation key (dot-notation)
   * @param variables - Optional variables for interpolation
   * @returns Translated string
   */
  t: (key: string, variables?: Record<string, string | number>) => string;
}

/**
 * React hook for translations with automatic re-rendering on locale change.
 *
 * Uses useSyncExternalStore for optimal performance and concurrent mode compatibility.
 *
 * @returns Translation utilities and current locale
 *
 * @example
 * function MyComponent() {
 *   const { t, locale, setLocale } = useTranslation();
 *
 *   return (
 *     <div>
 *       <h1>{t("common.welcome")}</h1>
 *       <p>{t("common.greeting", { name: "World" })}</p>
 *       <button onClick={() => setLocale("es")}>
 *         {t("common.switchToSpanish")}
 *       </button>
 *     </div>
 *   );
 * }
 */
export function useTranslation(): UseTranslationReturn {
  // Subscribe to locale changes using useSyncExternalStore for React 18+ compatibility
  const locale = useSyncExternalStore(
    useI18nStore.subscribe,
    () => useI18nStore.getState().locale,
    () => useI18nStore.getState().locale,
  );

  const setLocale = useCallback((newLocale: Locale) => {
    useI18nStore.getState().setLocale(newLocale);
  }, []);

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      const translations = getTranslations(locale);
      const template = translations[key];

      if (!template) {
        // Fallback to English if translation not found
        if (locale !== "en") {
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
    },
    [locale],
  );

  return { locale, setLocale, t };
}
