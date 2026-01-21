import { registerTranslations } from "@repo/utils";
import de from "./de";
import en from "./en";
import es from "./es";
import fr from "./fr";

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
