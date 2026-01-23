/**
 * Shared component type definitions for the Reactor design system.
 *
 * These interfaces define the contracts for components across platforms.
 * Platform-specific implementations (ui-web, ui-mobile, ui-marketing) should
 * implement these interfaces while adding platform-specific props as needed.
 */

// ============================================================================
// Button Types
// ============================================================================

/**
 * Available button style variants.
 *
 * @example
 * const variant: ButtonVariant = "primary";
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";

/**
 * Available button sizes.
 *
 * @example
 * const size: ButtonSize = "md";
 */
export type ButtonSize = "sm" | "md" | "lg" | "icon";

/**
 * Base props for Button components across all platforms.
 *
 * Platform-specific implementations extend this with native props.
 */
export interface ButtonBaseProps {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Shows loading state and disables the button */
  isLoading?: boolean;
  /** Disables the button */
  disabled?: boolean;
  /** Button content */
  children?: React.ReactNode;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Available input sizes.
 */
export type InputSize = "sm" | "md" | "lg";

/**
 * Base props for Input components across all platforms.
 */
export interface InputBaseProps {
  /** Input size */
  size?: InputSize;
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

// ============================================================================
// Typography Types
// ============================================================================

/**
 * Available heading levels.
 */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Available text sizes for body text.
 */
export type TextSize = "xs" | "sm" | "base" | "lg" | "xl";

/**
 * Available text weights.
 */
export type TextWeight = "normal" | "medium" | "semibold" | "bold";

/**
 * Base props for Text components.
 */
export interface TextBaseProps {
  /** Text size */
  size?: TextSize;
  /** Text weight */
  weight?: TextWeight;
  /** Muted/secondary text style */
  muted?: boolean;
  /** Text content */
  children?: React.ReactNode;
}

// ============================================================================
// Card Types
// ============================================================================

/**
 * Base props for Card components.
 */
export interface CardBaseProps {
  /** Card content */
  children?: React.ReactNode;
  /** Whether the card has a border */
  bordered?: boolean;
  /** Whether the card has a shadow */
  elevated?: boolean;
}

// ============================================================================
// Badge Types
// ============================================================================

/**
 * Available badge variants.
 */
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/**
 * Base props for Badge components.
 */
export interface BadgeBaseProps {
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge content */
  children?: React.ReactNode;
}

// ============================================================================
// Alert Types
// ============================================================================

/**
 * Available alert variants.
 */
export type AlertVariant = "default" | "destructive" | "success" | "warning";

/**
 * Base props for Alert components.
 */
export interface AlertBaseProps {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert description/content */
  children?: React.ReactNode;
}

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Available theme modes.
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved theme (without system option).
 */
export type ResolvedTheme = "light" | "dark";

// ============================================================================
// Locale Types
// ============================================================================

/**
 * Supported locales.
 *
 * Add new locales here when expanding i18n support.
 */
export type Locale = "en" | "es" | "fr" | "de";

/**
 * Default locale for the application.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * List of all supported locales.
 */
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "es", "fr", "de"] as const;
