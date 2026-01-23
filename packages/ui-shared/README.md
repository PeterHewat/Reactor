# @repo/ui-shared

Shared design tokens and TypeScript interfaces for the Reactor design system. This package provides the foundation for consistent UI across all platforms.

## Purpose

This package contains:

- **Design Tokens**: Colors, spacing, typography, shadows, and animation values
- **Component Types**: TypeScript interfaces for component props
- **Theme Types**: Types for theme and locale management

Platform-specific UI packages (`@repo/ui-web`, `@repo/ui-mobile`, `@repo/ui-astro`) consume these tokens and implement the component interfaces.

## Installation

This package is internal to the monorepo. Import via the path alias:

```ts
import { colors, spacing, ButtonVariant } from "@repo/ui-shared";
```

## Design Tokens

### Colors

HSL color values for light and dark themes:

```ts
import { colors } from "@repo/ui-shared";

// Access color tokens
const primaryLight = colors.primary.light; // "240 5.9% 10%"
const primaryDark = colors.primary.dark; // "0 0% 98%"
```

Available color tokens:

- `background` / `foreground` - Base colors
- `primary` / `primaryForeground` - Brand colors
- `muted` / `mutedForeground` - Secondary colors
- `accent` / `accentForeground` - Accent colors
- `destructive` / `destructiveForeground` - Error/danger colors
- `border` / `input` / `ring` - UI element colors

### Spacing

Pixel-based spacing scale (4px base unit):

```ts
import { spacing } from "@repo/ui-shared";

const padding = spacing[4]; // 16
const margin = spacing[8]; // 32
```

### Typography

Font sizes with line heights, and font weights:

```ts
import { fontSize, fontWeight } from "@repo/ui-shared";

const heading = fontSize["2xl"]; // { size: 24, lineHeight: 32 }
const bold = fontWeight.bold; // 700
```

### Border Radius

```ts
import { borderRadius } from "@repo/ui-shared";

const rounded = borderRadius.md; // 6
const pill = borderRadius.full; // 9999
```

### Shadows

CSS shadow strings (web) that can be converted for mobile:

```ts
import { shadows } from "@repo/ui-shared";

const cardShadow = shadows.md;
```

### Animation

Duration and easing values:

```ts
import { duration, easing } from "@repo/ui-shared";

const fast = duration[150]; // 150ms
const smooth = easing.inOut; // "cubic-bezier(0.4, 0, 0.2, 1)"
```

## Component Types

TypeScript interfaces for consistent component APIs:

```ts
import type { ButtonVariant, ButtonSize, ButtonBaseProps } from "@repo/ui-shared";

// Use in platform-specific implementations
interface WebButtonProps extends ButtonBaseProps {
  // Add web-specific props
  className?: string;
}
```

Available component types:

- `ButtonVariant`, `ButtonSize`, `ButtonBaseProps`
- `InputSize`, `InputBaseProps`
- `TextSize`, `TextWeight`, `TextBaseProps`
- `CardBaseProps`
- `BadgeVariant`, `BadgeBaseProps`
- `AlertVariant`, `AlertBaseProps`

## Theme & Locale Types

```ts
import type { ThemeMode, ResolvedTheme, Locale } from "@repo/ui-shared";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@repo/ui-shared";

const theme: ThemeMode = "system";
const resolved: ResolvedTheme = "dark";
const locale: Locale = "en";
```

## Platform Integration

### Web (Tailwind CSS)

Convert tokens to CSS custom properties in your `index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Mobile (React Native)

Convert HSL tokens to hex/rgba for React Native StyleSheet:

```ts
import { colors } from "@repo/ui-shared";

// Helper to convert HSL string to hex
const hslToHex = (hsl: string): string => {
  // Implementation...
};

const theme = {
  primary: hslToHex(colors.primary.light),
};
```

### Marketing (Astro)

Use the same CSS custom properties approach as web, or import tokens directly in Astro components.

## Development

```bash
# Type check
npm run typecheck -w packages/ui-shared

# Build
npm run build -w packages/ui-shared

# Lint
npm run lint -w packages/ui-shared
```
