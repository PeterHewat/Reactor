/**
 * @repo/ui-marketing
 *
 * Astro components for the Reactor marketing site.
 * Built with Tailwind CSS for consistent styling with the web app.
 *
 * This is a scaffold package. See README.md for setup instructions.
 *
 * Note: Astro components (.astro files) are typically placed directly
 * in the marketing app. This package provides TypeScript utilities
 * and shared component logic.
 */

// Re-export shared types for convenience
export type {
  ButtonBaseProps,
  ButtonSize,
  ButtonVariant,
  TextBaseProps,
  TextSize,
  TextWeight,
} from "@repo/ui-shared";

// Re-export design tokens for use in Astro components
export {
  borderRadius,
  colors,
  duration,
  easing,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from "@repo/ui-shared";

/**
 * Placeholder to verify package setup.
 * Remove this after implementing actual utilities.
 */
export const UI_ASTRO_VERSION = "0.0.0";
