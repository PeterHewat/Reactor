/**
 * Design tokens for the Reactor design system.
 *
 * These tokens define the visual language shared across all platforms:
 * - Web (React + Tailwind CSS)
 * - Mobile (React Native + NativeWind)
 * - Marketing (Astro + Tailwind CSS)
 *
 * Platform-specific implementations consume these tokens and adapt them
 * to their respective styling systems.
 */

// ============================================================================
// Color Tokens
// ============================================================================

/**
 * Semantic color tokens using HSL values.
 *
 * These are defined as HSL components (without the hsl() wrapper) to allow
 * flexibility in how platforms consume them:
 * - Web: CSS custom properties with hsl() wrapper
 * - Mobile: Convert to hex/rgba for React Native
 */
export const colors = {
  // Background colors
  background: {
    light: "0 0% 100%",
    dark: "240 10% 3.9%",
  },
  foreground: {
    light: "240 10% 3.9%",
    dark: "0 0% 98%",
  },

  // Primary brand colors
  primary: {
    light: "240 5.9% 10%",
    dark: "0 0% 98%",
  },
  primaryForeground: {
    light: "0 0% 98%",
    dark: "240 5.9% 10%",
  },

  // Secondary/muted colors
  muted: {
    light: "240 4.8% 95.9%",
    dark: "240 3.7% 15.9%",
  },
  mutedForeground: {
    light: "240 3.8% 46.1%",
    dark: "240 5% 64.9%",
  },

  // Accent colors
  accent: {
    light: "240 4.8% 95.9%",
    dark: "240 3.7% 15.9%",
  },
  accentForeground: {
    light: "240 5.9% 10%",
    dark: "0 0% 98%",
  },

  // Border and input colors
  border: {
    light: "240 5.9% 90%",
    dark: "240 3.7% 15.9%",
  },
  input: {
    light: "240 5.9% 90%",
    dark: "240 3.7% 15.9%",
  },
  ring: {
    light: "240 5.9% 10%",
    dark: "240 4.9% 83.9%",
  },

  // Semantic colors
  destructive: {
    light: "0 84.2% 60.2%",
    dark: "0 62.8% 30.6%",
  },
  destructiveForeground: {
    light: "0 0% 98%",
    dark: "0 0% 98%",
  },
} as const;

/**
 * Type for color token keys.
 */
export type ColorToken = keyof typeof colors;

// ============================================================================
// Spacing Tokens
// ============================================================================

/**
 * Spacing scale in pixels.
 *
 * Based on a 4px base unit for consistency across platforms.
 */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

/**
 * Type for spacing token keys.
 */
export type SpacingToken = keyof typeof spacing;

// ============================================================================
// Typography Tokens
// ============================================================================

/**
 * Font size scale with corresponding line heights.
 *
 * Values are in pixels for consistency; platforms convert as needed.
 */
export const fontSize = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  "2xl": { size: 24, lineHeight: 32 },
  "3xl": { size: 30, lineHeight: 36 },
  "4xl": { size: 36, lineHeight: 40 },
  "5xl": { size: 48, lineHeight: 48 },
  "6xl": { size: 60, lineHeight: 60 },
  "7xl": { size: 72, lineHeight: 72 },
  "8xl": { size: 96, lineHeight: 96 },
  "9xl": { size: 128, lineHeight: 128 },
} as const;

/**
 * Font weight values.
 */
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Type for font size token keys.
 */
export type FontSizeToken = keyof typeof fontSize;

/**
 * Type for font weight token keys.
 */
export type FontWeightToken = keyof typeof fontWeight;

// ============================================================================
// Border Radius Tokens
// ============================================================================

/**
 * Border radius scale in pixels.
 */
export const borderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: 9999,
} as const;

/**
 * Type for border radius token keys.
 */
export type BorderRadiusToken = keyof typeof borderRadius;

// ============================================================================
// Shadow Tokens
// ============================================================================

/**
 * Box shadow definitions.
 *
 * These are CSS shadow strings for web; mobile platforms will need to
 * convert these to their native shadow properties.
 */
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  none: "0 0 #0000",
} as const;

/**
 * Type for shadow token keys.
 */
export type ShadowToken = keyof typeof shadows;

// ============================================================================
// Animation Tokens
// ============================================================================

/**
 * Transition duration values in milliseconds.
 */
export const duration = {
  75: 75,
  100: 100,
  150: 150,
  200: 200,
  300: 300,
  500: 500,
  700: 700,
  1000: 1000,
} as const;

/**
 * Easing functions for animations.
 */
export const easing = {
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/**
 * Type for duration token keys.
 */
export type DurationToken = keyof typeof duration;

/**
 * Type for easing token keys.
 */
export type EasingToken = keyof typeof easing;
