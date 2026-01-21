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

The `convex/` folder contains a minimal placeholder. Run the Convex CLI from the repository root to initialize your project:

```bash
npx convex dev
```

This will:

1. Prompt you to log in to Convex
2. Create a new project (or connect to an existing one)
3. Generate `convex/_generated/` files
4. Created at the repo root.

### Auth Integration (Clerk + Convex)

After initializing Convex, integrate Clerk for authentication:

1. Install Clerk: `npm install -w apps/web @clerk/clerk-react`
2. Configure `ClerkProvider` and `ConvexProviderWithClerk` in your app entry
3. Create `convex/auth.config.ts` with your Clerk domain
4. Use `ctx.auth.getUserIdentity()` in Convex functions to verify users
5. Validate every mutation input with `v.object({ ... })` and surface errors via `ConvexError`

Full setup instructions are in [convex/README.md](../convex/README.md).

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

### Testing Convex Functions

Unit test Convex functions with `convex-test`:

```bash
npm install -D convex-test
```

```ts
// convex/mutations/addTodo.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("addTodo creates a todo", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.mutations.addTodo, {
    title: "Test todo",
    userId: "user123",
  });
  expect(id).toBeDefined();
});
```

### Mocking in E2E Tests (Playwright)

For E2E tests that need to mock Convex responses, use Playwright's route interception:

```ts
// apps/web/tests/example.e2e.ts
test("shows data when API returns results", async ({ page }) => {
  await page.route("**/api/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: "mocked" }),
    });
  });
  await page.goto("/");
  // Assert mocked data appears
});
```

For most E2E tests, prefer running against a real Convex dev deployment rather than mocking.

## GitHub Actions Secrets

Configure these secrets in your repository for CI/CD deployments:

**Repository Settings > Secrets and variables > Actions > New repository secret**

### Required Secrets

| Secret | Description | Where to find it |
|--------|-------------|------------------|
| `CONVEX_DEPLOY_KEY` | Convex deployment key for CI/CD | Convex Dashboard > Settings > Deploy Key |
| `VITE_CONVEX_URL` | Your Convex deployment URL | Convex Dashboard > Settings > URL (e.g., `https://your-project.convex.cloud`) |

### Optional Secrets (if using Clerk)

| Secret | Description | Where to find it |
|--------|-------------|------------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk Dashboard > API Keys |

### Deployment Provider Secrets

Choose your deployment platform and add the required secrets:

#### Vercel

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (Account Settings > Tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |

#### Netlify

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Your Netlify site ID |

#### Cloudflare Pages

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

### Getting the Convex Deploy Key

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to **Settings** > **Deploy Key**
4. Click **Generate Deploy Key**
5. Copy the key and add it as `CONVEX_DEPLOY_KEY` in GitHub Secrets

> **Security Note**: Never commit secrets to your repository. Always use GitHub Secrets or environment variables for sensitive values.

## Next Steps

- Follow [.github/copilot-instructions.md](../.github/copilot-instructions.md) for coding standards and patterns
- Add Vitest and Playwright after the frontend scaffold
- See [../README.md](../README.md) for development workflows and ongoing tooling
