# Marketing Site (Astro)

Static marketing site built with Astro. This is a **scaffold directory** - you'll run the Astro CLI to generate the actual site.

## Why Astro?

- **Performance**: Static HTML with zero JavaScript by default
- **SEO**: Server-rendered pages with full control over meta tags
- **Flexibility**: Use any UI framework (React, Vue, Svelte) or none
- **Content-focused**: Built-in support for Markdown and MDX
- **Fast builds**: Incremental builds and smart caching

## Prerequisites

- Node.js 24+ (already required by the monorepo)
- npm 10+

## Setup Instructions

### 1. Initialize Astro Project

From the `apps/marketing` directory, initialize the Astro project in place:

```bash
cd apps/marketing

# Initialize Astro in a temporary directory
npm create astro@latest temp-astro -- --template minimal --typescript strict

# Move generated files to current directory
mv temp-astro/* . 2>/dev/null || true
mv temp-astro/.* . 2>/dev/null || true
rm -rf temp-astro

# The existing package.json already has workspace dependencies configured
# Merge Astro dependencies into it (see step 2)
```

### 2. Merge Package Dependencies

The existing `package.json` already has the workspace name and dependencies. After initialization, merge the Astro dependencies:

```bash
# Install Astro (add to existing package.json)
npm install astro

# The workspace dependencies are already configured:
# "@repo/ui-marketing", "@repo/ui-shared"
```

### 3. Install Tailwind CSS

```bash
npx astro add tailwind
```

This will:

- Install `@astrojs/tailwind` and `tailwindcss`
- Create `tailwind.config.mjs`
- Update `astro.config.mjs`

### 4. Configure Tailwind

Update `apps/marketing/tailwind.config.mjs`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "../../packages/ui-marketing/src/**/*.{ts,tsx}",
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
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
    },
  },
  plugins: [],
};
```

### 5. Add Global Styles

Create `apps/marketing/src/styles/global.css`:

```css
@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
}

html {
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

### 6. Configure TypeScript

Update `apps/marketing/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@repo/ui-marketing": ["../../packages/ui-marketing/src/index.ts"],
      "@repo/ui-shared": ["../../packages/ui-shared/src/index.ts"]
    }
  }
}
```

## Project Structure

After setup, your marketing site structure should look like:

```
apps/marketing/
├── public/               # Static assets (favicon, images)
├── src/
│   ├── components/       # Astro components
│   ├── layouts/          # Page layouts
│   ├── pages/            # File-based routing
│   │   ├── index.astro   # Home page (/)
│   │   ├── about.astro   # About page (/about)
│   │   └── blog/         # Blog section (/blog/*)
│   ├── content/          # Content collections (blog posts, etc.)
│   └── styles/           # Global styles
├── astro.config.mjs      # Astro configuration
├── tailwind.config.mjs   # Tailwind configuration
└── package.json
```

## Creating Pages

### Basic Page

```astro
---
// src/pages/index.astro
import Layout from "../layouts/Layout.astro";
import Hero from "../components/Hero.astro";
import Features from "../components/Features.astro";
---

<Layout title="Reactor - Modern Monorepo Starter">
  <Hero
    title="Build faster with Reactor"
    subtitle="A production-ready monorepo template for web, mobile, and marketing."
    ctaText="Get Started"
    ctaHref="/docs"
  />
  <Features />
</Layout>
```

### Layout Component

```astro
---
// src/layouts/Layout.astro
import "../styles/global.css";

interface Props {
  title: string;
  description?: string;
}

const { title, description = "Reactor - Modern Monorepo Starter" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Content Collections

Astro's content collections are perfect for blog posts and documentation.

### Define Collection Schema

```ts
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { blog };
```

### Create Blog Post

```md
---
# src/content/blog/hello-world.md
title: "Hello World"
description: "Our first blog post"
pubDate: 2024-01-15
author: "Team Reactor"
---

Welcome to our blog! This is our first post.

## Getting Started

Here's how to use Reactor...
```

### List Blog Posts

```astro
---
// src/pages/blog/index.astro
import { getCollection } from "astro:content";
import Layout from "../../layouts/Layout.astro";

const posts = await getCollection("blog");
---

<Layout title="Blog">
  <main class="mx-auto max-w-4xl px-4 py-12">
    <h1 class="mb-8 text-4xl font-bold">Blog</h1>
    <ul class="space-y-4">
      {
        posts.map((post) => (
          <li>
            <a href={`/blog/${post.slug}`} class="text-primary hover:underline">
              {post.data.title}
            </a>
            <p class="text-muted-foreground">{post.data.description}</p>
          </li>
        ))
      }
    </ul>
  </main>
</Layout>
```

## SEO Best Practices

### Meta Tags

```astro
---
// In your layout or page
const { title, description, image } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalURL} />

  <!-- Open Graph -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:image" content={image} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</head>
```

### Sitemap

```bash
npx astro add sitemap
```

### RSS Feed

```bash
npx astro add rss
```

## Development

### Running Locally

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Scripts to Add

Update `apps/marketing/package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "eslint .",
    "typecheck": "astro check && tsc",
    "test": "vitest run"
  }
}
```

## Deployment

Astro builds to static HTML by default, making it easy to deploy anywhere.

### Vercel

```bash
npx astro add vercel
```

### Netlify

```bash
npx astro add netlify
```

### Cloudflare Pages

```bash
npx astro add cloudflare
```

### Static Hosting

Build and deploy the `dist/` folder to any static host:

```bash
npm run build
# Upload dist/ to your host
```

## Using Design Tokens

Import tokens from the shared package:

```astro
---
import { colors, spacing } from "@repo/ui-marketing";

// Use in component logic
const paddingValue = spacing[8];
---

<div style={`padding: ${paddingValue}px`}>
  <!-- Or use Tailwind classes that map to the same tokens -->
  <div class="p-8 bg-primary text-primary-foreground">Content</div>
</div>
```

## Testing

### Unit Tests (Vitest)

```bash
npm install -D vitest
```

```ts
// src/utils/format.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  it("formats dates correctly", () => {
    expect(formatDate(new Date("2024-01-15"))).toBe("January 15, 2024");
  });
});
```

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

## Resources

- [Astro Documentation](https://docs.astro.build/)
- [Astro + Tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro SEO](https://docs.astro.build/en/guides/seo/)
- [Deploy Astro](https://docs.astro.build/en/guides/deploy/)
