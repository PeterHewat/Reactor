# @repo/ui-astro

Astro components and utilities for the Reactor marketing site. Provides TypeScript utilities and design tokens for building marketing pages with consistent styling.

## Status

This is a **scaffold package**. Components will be implemented after the marketing site is set up in `apps/marketing/`.

## Architecture

Unlike `@repo/ui-web` and `@repo/ui-mobile`, Astro components (`.astro` files) are typically placed directly in the marketing app rather than in a shared package. This is because:

1. Astro components are tightly coupled to Astro's build system
2. Marketing pages often have unique, content-focused layouts
3. Static site generation benefits from co-located components

This package provides:

- **Design tokens** re-exported from `@repo/ui-shared`
- **TypeScript utilities** for component logic
- **Type definitions** for consistent prop interfaces

## Setup Instructions

### 1. Create the Marketing App

```bash
# From repository root
npm create astro@latest apps/marketing -- --template minimal --typescript strict
```

### 2. Install Tailwind CSS

```bash
cd apps/marketing
npx astro add tailwind
```

### 3. Configure Tailwind for Monorepo

Update `apps/marketing/tailwind.config.mjs`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "../../packages/ui-astro/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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

### 4. Add CSS Variables

Create `apps/marketing/src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
}

:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
}
```

### 5. Configure TypeScript Paths

Update `apps/marketing/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@repo/ui-astro": ["../../packages/ui-astro/src/index.ts"],
      "@repo/ui-shared": ["../../packages/ui-shared/src/index.ts"]
    }
  }
}
```

## Creating Astro Components

### Button Component

Create `apps/marketing/src/components/Button.astro`:

```astro
---
import type { ButtonVariant, ButtonSize } from "@repo/ui-astro";

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  class?: string;
}

const { variant = "primary", size = "md", href, class: className } = Astro.props;

const variantClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
  ghost: "bg-transparent hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-transparent hover:bg-accent",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

const baseClasses =
  "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className]
  .filter(Boolean)
  .join(" ");

const Element = href ? "a" : "button";
---

<Element href={href} class={classes}>
  <slot />
</Element>
```

### Hero Section

Create `apps/marketing/src/components/Hero.astro`:

```astro
---
interface Props {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

const { title, subtitle, ctaText, ctaHref } = Astro.props;
---

<section class="bg-background py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div class="mx-auto max-w-2xl text-center">
      <h1 class="text-foreground text-4xl font-bold tracking-tight sm:text-6xl">
        {title}
      </h1>
      {
        subtitle && (
          <p class="text-muted-foreground mt-6 text-lg leading-8">{subtitle}</p>
        )
      }
      {
        ctaText && ctaHref && (
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <a
              href={ctaHref}
              class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-sm font-semibold shadow-sm transition-colors"
            >
              {ctaText}
            </a>
          </div>
        )
      }
    </div>
  </div>
</section>
```

## Marketing Component Checklist

Common marketing site components to implement:

- [ ] Hero - Landing page hero section
- [ ] Features - Feature grid/list
- [ ] Testimonials - Customer quotes
- [ ] Pricing - Pricing table
- [ ] CTA - Call-to-action sections
- [ ] Footer - Site footer with links
- [ ] Header/Nav - Navigation header
- [ ] FAQ - Accordion FAQ section

## Using Design Tokens

Import tokens directly in Astro components:

```astro
---
import { spacing, colors } from "@repo/ui-astro";

// Use in inline styles or logic
const paddingValue = spacing[8]; // 32
---

<div style={`padding: ${paddingValue}px`}>
  <!-- Content -->
</div>
```

Or use Tailwind classes that map to the same tokens:

```astro
<div class="p-8 bg-primary text-primary-foreground">
  <!-- Uses same values as design tokens -->
</div>
```

## SEO Optimization

Astro excels at SEO. Use the built-in features:

```astro
---
// src/pages/index.astro
import Layout from "../layouts/Layout.astro";
---

<Layout
  title="Reactor - Modern Monorepo Starter"
  description="A production-ready monorepo template for React, React Native, and Astro."
>
  <!-- Page content -->
</Layout>
```

## Development

```bash
# Type check
npm run typecheck -w packages/ui-astro

# Build
npm run build -w packages/ui-astro

# Lint
npm run lint -w packages/ui-astro
```

## Dependencies

- `@repo/ui-shared` - Design tokens and type definitions
- `astro` (peer) - Astro framework
