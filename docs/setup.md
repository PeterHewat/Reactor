# Project Setup Guide

> **Note**: This document contains everything needed for initial project setup, including scaffolding steps and configuration examples. Once your project is scaffolded and running, this file can be safely deleted.

## Scaffold Frontend (React + Vite + Tailwind)

Create a React app in `apps/web`.

```bash
npm create vite@latest apps/web -- --template react-ts
cd apps/web
npm install
npm install react@^19 react-dom@^19
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure Tailwind in `apps/web/tailwind.config.js`:

- `content: ["./index.html", "./src/**/*.{ts,tsx}"]`

Add Tailwind directives in `apps/web/src/index.css`:

- `@tailwind base; @tailwind components; @tailwind utilities;`

## Scaffold Backend (Convex CLI)

Use the Convex CLI from the repository root. The first run will create `convex/` and `.env.local`.

```bash
npx convex dev
```

You'll be prompted to log in; a `convex/` folder is created at the repo root.

### Auth Integration (Clerk + Convex)

This starter intentionally defers backend scaffolding to you. After initializing Convex, integrate Clerk for auth:

1. Install Clerk in the web app and configure the provider
2. Use `useConvexAuth()` on the client to read auth state
3. Gate Convex functions with `internalQuery`/`internalMutation` for non-public logic
4. Validate every action/mutation input with `v.object({ ... })` and surface business errors via `ConvexError`

## Configuration Examples

> Use these examples as reference during setup. Once your project is running, refer to the actual code instead of these docs.

### Tailwind Theme Tokens

Define and use semantic tokens to avoid arbitrary values and keep consistency across UI:

- **Colors:** `text-primary`, `bg-primary`, `border-muted`, `bg-muted`, `text-muted-foreground`
- **Radius:** `rounded-sm`, `rounded-md`, `rounded-lg`
- **Spacing:** `p-2`, `p-3`, `p-4` (via scale)
- **Typography:** `heading`, `subheading`, `body` via `@apply` utilities

Example `tailwind.config.js` (frontend):

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // include shared packages
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/utils/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      borderRadius: {
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
};
```

Use `cn()` from `@repo/utils` to merge classes and apply variants.

### UI Components (packages/ui)

Minimal UI components consume Tailwind tokens and `cn()` for variants. Import via the path alias and use in client components:

```tsx
// apps/web/src/App.tsx
"use client";
import { Button } from "@repo/ui";

export function App() {
  return (
    <div className="p-4">
      <Button variant="primary" size="md">
        Click me
      </Button>
      <Button variant="secondary" size="sm" className="ml-2">
        Cancel
      </Button>
    </div>
  );
}
```

### Environment Config (packages/utils)

Use the typed env helper to read required/optional variables safely without logging secrets:

```ts
// Example: load env in Node contexts
import { loadEnv, asString, asBoolean, asInt } from "@repo/utils";

const env = loadEnv({
  CLERK_SECRET_KEY: { key: "CLERK_SECRET_KEY", parse: asString },
  ENABLE_EXPERIMENTS: {
    key: "ENABLE_EXPERIMENTS",
    parse: asBoolean,
    optional: true,
    defaultValue: false,
  },
  PORT: { key: "PORT", parse: asInt, optional: true, defaultValue: 3000 },
});
```

### Path Aliases

Imports are simplified via TypeScript `paths`:

- `@repo/ui` → UI components
- `@repo/utils` → Utilities like `cn()` and env helpers

Example:

```ts
import { Button } from "@repo/ui";
import { cn, loadEnv } from "@repo/utils";
```

### Convex Schema Example

After running `npx convex dev`, create `convex/schema.ts` and validate inputs with `v`. Example:

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.string(),
  }),
});

// convex/mutations/addTodo.ts
import { mutation } from "convex/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const addTodo = mutation({
  args: { title: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.title.trim()) {
      throw new ConvexError("Title is required");
    }
    const id = await ctx.db.insert("todos", {
      title: args.title,
      completed: false,
      userId: args.userId,
    });
    return id;
  },
});
```

On the client, use `useQuery`/`useMutation` for data and `useConvexAuth()` for auth state. Avoid `fetch`/`axios`/`useEffect` for loading data.

### API Mocks (Optional)

- For local development without a backend, consider using MSW (Mock Service Worker): https://mswjs.io/
- Place mock handlers alongside frontend code (e.g., under `apps/web/src/mock`) and wire them conditionally for dev
- Keep mocks in sync with actual API types to avoid drift; update mocks when backend schema changes

## Next Steps

- Follow [.github/copilot-instructions.md](../.github/copilot-instructions.md) for coding standards and patterns
- Add Vitest and Playwright after the frontend scaffold
- See [../README.md](../README.md) for development workflows and ongoing tooling
