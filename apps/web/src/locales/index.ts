import { registerTranslations } from "@repo/utils";
import en from "./en";
import es from "./es";

/**
 * Initialize all translations.
 * Call this once at app startup before rendering.
 */
export function initializeTranslations(): void {
  registerTranslations("en", en);
  registerTranslations("es", es);
}
