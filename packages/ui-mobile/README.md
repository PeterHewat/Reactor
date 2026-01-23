# @repo/ui-mobile

React Native UI components for the Reactor design system. Built with NativeWind for Tailwind-like styling that matches the web design system.

## Status

This is a **scaffold package**. Components will be implemented after the mobile app is set up in `apps/mobile/`.

## Setup Instructions

### Prerequisites

Before implementing components, ensure `apps/mobile/` is set up with:

1. React Native CLI project
2. NativeWind configured
3. React Navigation (if using navigation components)

### 1. Install NativeWind in the Mobile App

```bash
# In apps/mobile/
npm install nativewind
npm install -D tailwindcss@^3.4.0
```

### 2. Configure Tailwind for React Native

Create `apps/mobile/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui-mobile/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Import from @repo/ui-shared tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
    },
  },
  plugins: [],
};
```

### 3. Add NativeWind Babel Plugin

Update `apps/mobile/babel.config.js`:

```js
module.exports = {
  presets: ["module:@react-native/babel-preset", "nativewind/babel"],
};
```

### 4. Configure Metro for Monorepo

Create or update `apps/mobile/metro.config.js`:

```js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(monorepoRoot, "node_modules"),
    ],
    extraNodeModules: {
      "@repo/ui-mobile": path.resolve(monorepoRoot, "packages/ui-mobile"),
      "@repo/ui-shared": path.resolve(monorepoRoot, "packages/ui-shared"),
      "@repo/utils": path.resolve(monorepoRoot, "packages/utils"),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
```

## Implementing Components

### Button Example

```tsx
// packages/ui-mobile/src/button.tsx
import { Pressable, Text, ActivityIndicator } from "react-native";
import type { ButtonBaseProps } from "@repo/ui-shared";

interface ButtonProps extends ButtonBaseProps {
  onPress?: () => void;
  className?: string;
}

const variantStyles = {
  primary: "bg-primary active:bg-primary/90",
  secondary: "bg-muted active:bg-muted/80",
  ghost: "bg-transparent active:bg-muted",
  destructive: "bg-destructive active:bg-destructive/90",
  outline: "border border-input bg-transparent",
  link: "bg-transparent",
};

const sizeStyles = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-12 px-6",
  icon: "h-10 w-10",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  onPress,
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`flex-row items-center justify-center rounded-md ${variantStyles[variant]} ${sizeStyles[size]} ${disabled || isLoading ? "opacity-60" : ""} ${className ?? ""} `}
    >
      {isLoading ? (
        <ActivityIndicator color="currentColor" />
      ) : (
        <Text className="text-primary-foreground font-medium">{children}</Text>
      )}
    </Pressable>
  );
}
```

### Using Design Tokens

```tsx
import { colors, spacing } from "@repo/ui-shared";

// Convert HSL to a format React Native can use
const styles = StyleSheet.create({
  container: {
    padding: spacing[4], // 16
    // For colors, use NativeWind classes or convert HSL
  },
});
```

## Component Checklist

Implement these components to match `@repo/ui-web`:

- [ ] Button - Pressable with variants and sizes
- [ ] Input - TextInput with styling
- [ ] Text - Styled Text component
- [ ] Card - View with card styling
- [ ] Badge - Small status indicators
- [ ] Alert - Feedback messages
- [ ] ThemeToggle - Theme switching (uses Appearance API)
- [ ] LanguageSwitcher - Locale switching

## Platform Differences

### Styling

- Web uses Tailwind CSS v4 with CSS custom properties
- Mobile uses NativeWind (Tailwind for React Native)
- Both share the same design tokens from `@repo/ui-shared`

### Interactions

- Web: hover, focus-visible, click
- Mobile: press, long-press, gestures

### Theme Management

- Web: DOM-based (`.dark` class on `<html>`)
- Mobile: React Native `Appearance` API

```tsx
import { Appearance } from "react-native";

// Get system theme
const colorScheme = Appearance.getColorScheme(); // 'light' | 'dark'

// Listen for changes
Appearance.addChangeListener(({ colorScheme }) => {
  // Update theme
});
```

## Testing

Use React Native Testing Library:

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "@repo/ui-mobile";

test("Button renders and handles press", () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button onPress={onPress}>Click me</Button>);

  fireEvent.press(getByText("Click me"));
  expect(onPress).toHaveBeenCalled();
});
```

## Development

```bash
# Type check
npm run typecheck -w packages/ui-mobile

# Build
npm run build -w packages/ui-mobile

# Lint
npm run lint -w packages/ui-mobile
```

## Dependencies

- `@repo/ui-shared` - Design tokens and type definitions
- `@repo/utils` - Shared utilities
- `react-native` (peer) - React Native runtime
- `nativewind` - Tailwind CSS for React Native
