import type { FlattenKeys } from "@repo/utils";
import { registerTranslations } from "@repo/utils";
import de from "./de";
import en from "./en";
import es from "./es";
import fr from "./fr";

/**
 * Union of all valid translation keys, derived from the English locale.
 *
 * Provides compile-time safety: `t("home.typo")` will be a type error.
 *
 * @example
 * const key: TranslationKey = "home.title"; // ✓
 * const bad: TranslationKey = "home.typo";  // ✗ Type error
 */
export type TranslationKey = FlattenKeys<typeof en>;

/**
 * Initialize all translations.
 * Call this once at app startup before rendering.
 */
export function initializeTranslations(): void {
  registerTranslations("en", en);
  registerTranslations("es", es);
  registerTranslations("fr", fr);
  registerTranslations("de", de);
}
