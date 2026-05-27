# Project Setup Guide

> **Note**: First-time scaffolding and local development. For CI jobs, GitHub secrets, releases, and PR previews, see [ci-cd.md](./ci-cd.md). Linking Convex (and Clerk for web) often comes after the web app runs locally.

## Platform Overview

This monorepo includes:

| Platform  | Directory         | Status   | Description                                                                  |
| --------- | ----------------- | -------- | ---------------------------------------------------------------------------- |
| Web       | `apps/web/`       | Ready    | React 19 + Vite + Tailwind CSS                                               |
| Marketing | `apps/marketing/` | Ready    | Astro 6 + Vite 7 + Tailwind CSS v4                                           |
| Convex    | `convex/`         | Scaffold | Sample schema/functions in repo; link your deployment with `bunx convex dev` |

**Scaffold** (Convex) = sample schema and functions are committed; you connect your own deployment with `bunx convex dev`. **Ready** = dev server and unit tests run from the repo without extra steps.

For the full matrix (including CI/CD), see the [platform status table](../README.md#platform-status) in the README.

For CI jobs, GitHub secrets, release deploys, and PR previews (`e2e` / `preview` labels), see [ci-cd.md](./ci-cd.md).

For layout, aliases, release tags, and when to add feature folders, see [monorepo-structure.md](./monorepo-structure.md).

## Environment variables

Three intentional layers — do not import `@repo/utils` from Convex (React/Zustand peers):

| Layer          | Location                                        | When to use                                                        |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Generic loader | `packages/utils/src/env.ts` (`@repo/utils/env`) | `loadEnv` + parsers with any source adapter                        |
| Web app        | `apps/web/src/env.ts`                           | `VITE_*` via `import.meta.env`; `loadWebEnv()` / `requireWebEnv()` |
| Convex server  | `convex/lib/env.ts`                             | `requireEnv` for dashboard variables only                          |

### Env file map

| Template                   | Copy to                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `.env.example` (repo root) | `.env.local` at repo root — Convex deployment, Clerk JWT issuer for dashboard |
| `apps/web/.env.example`    | `apps/web/.env.local` — `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`       |

Never commit `.env.local` files.

## Typecheck vs build

| Command                  | Purpose                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `bun run typecheck`      | Solution-wide `tsc --noEmit` (no artifacts)                                                                  |
| `bun run typecheck:refs` | Verify TS project references (`tsc -b` without caring about app bundles)                                     |
| `bun run build`          | Emit composite `.d.ts` for packages (`tsc -b`) — not Vite/Astro production output                            |
| `bun run build:all`      | `build` (solution `tsc -b`) then every workspace `build` (web, marketing, convex typecheck, package `.d.ts`) |

Per-app production: `bun run --filter @repo/web build`, `bun run --filter @repo/marketing build`.

## Dependency overrides

Root `package.json` `overrides` pin transitive dependency versions. Document every change in [dependency-overrides.md](./dependency-overrides.md) (keep version column aligned with `package.json`).

## Install and git hooks

From the repository root, `bun install` installs dependencies and runs the `prepare` script, which wires [Husky](https://typicode.github.io/husky/) git hooks under `.husky/`. The pre-commit hook runs [lint-staged](https://github.com/lint-staged/lint-staged) on staged files (ESLint + Prettier for code, Prettier for config/markup). CI still runs the full lint and test suite on push; hooks catch common issues before commit. To skip hooks for a single commit: `git commit --no-verify`.

## Web Frontend (React + Vite + Tailwind)

The web app is already scaffolded and ready to use. Dependencies are managed at the monorepo root.

To start development:

```bash
bun run --filter @repo/web dev
```

> **Note**: If creating a new web app from scratch, use `bun create vite@latest` with the `react-ts` template, then configure Tailwind CSS v4 with `@tailwindcss/postcss`.

## Marketing Site (Astro)

The marketing app is **ready** in the repo (Astro 6 + Tailwind v4 via `@tailwindcss/vite`; Astro bundles Vite 7). The web app uses the root Vite 8 devDependency. See `apps/marketing/README.md` for stack notes and structure.

### Quick Start

From the repository root:

```bash
bun run --filter @repo/marketing dev
bun run --filter @repo/marketing build
```

### Customization

1. Edit content under `apps/marketing/src/pages/` and `src/components/`
2. Align branding via Tailwind theme and CSS variables in `src/styles/`
3. Configure deploy secrets in GitHub (see [ci-cd.md](./ci-cd.md)) and use the Release workflow

If you are creating a **new** marketing app from scratch elsewhere, the historical Astro init steps are in git history; this starter no longer requires them.

## Scaffold Backend (Convex CLI)

Sample schema and functions are already in `convex/`. Link **your** Convex project from the repository root:

```bash
bunx convex dev
```

This will:

1. Prompt you to log in to Convex
2. Create a new project (or connect to an existing one)
3. Generate `convex/_generated/` files
4. Created at the repo root.

### Auth Integration (Clerk + Convex)

After initializing Convex, integrate Clerk for authentication:

1. Install Clerk: `bun install --filter @repo/web @clerk/react`
2. Wire providers in `apps/web/src/main.tsx` — see [convex/README.md](../convex/README.md#step-3-connect-the-frontend)
3. Copy `convex/auth.config.ts.example` to `convex/auth.config.ts` and set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard
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
    "../../packages/ui-web/src/**/*.{ts,tsx}",
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

### UI Components (packages/ui-web)

Minimal UI components consume Tailwind tokens and `cn()` for variants. Import via the path alias and use in client components:

```tsx
// apps/web/src/App.tsx
"use client";
import { Button } from "@repo/ui-web";

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

### Design tokens (per app)

Use Tailwind theme extensions and CSS variables in each app (`apps/web`, `apps/marketing`). Marketing example: `apps/marketing/tailwind.config.mjs` and `src/styles/global.css`. Web uses `@tailwindcss/postcss` and app-level theme tokens.

Shared UI semantics (theme mode, locales) live in `@repo/utils` — not a separate tokens package.

### Environment Config (`@repo/utils/env`)

Use the typed env helper to read required/optional variables safely without logging secrets:

```ts
// Example: load env in Node contexts
import { loadEnv, asString, asBoolean, asInt } from "@repo/utils/env";

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

Imports use workspace aliases defined in [tsconfig.paths.json](../tsconfig.paths.json) and [packages/config/aliases.ts](../packages/config/aliases.ts) (Vite/Vitest).

- `@repo/ui-web` → Web UI components
- `@repo/utils` → `cn()` and barrel re-exports
- `@repo/utils/env`, `/theme`, `/i18n`, `/storage`, `/use-translation` → narrow subpath imports

Example:

```ts
import { Button } from "@repo/ui-web";
import { cn } from "@repo/utils";
import { loadEnv } from "@repo/utils/env";
```

### Convex Schema Example

The repo already includes `convex/schema.ts` and authenticated handlers in `convex/tasks.ts`. Example pattern:

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});

// convex/tasks.ts (excerpt)
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";
import { parseTitle } from "./lib/validation";

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const title = parseTitle(args.title);
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title,
      completed: false,
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

On the client, use `useQuery`/`useMutation` for data and `useConvexAuth()` for auth state. Avoid `fetch`/`axios`/`useEffect` for loading data.

### Testing Convex Functions

`convex-test` is already configured. Authenticated handlers are tested with `withIdentity`:

```ts
// convex/tasks.test.ts (excerpt)
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

test("create inserts a task for the signed-in user", async () => {
  const t = convexTest(schema, modules).withIdentity({ subject: "user_abc" });
  const id = await t.mutation(api.tasks.create, { title: "Test task" });
  expect(id).toBeDefined();
});
```

### E2E tests with Convex (Playwright)

Convex WebSocket traffic does **not** match a simple `**/api/**` HTTP route. Prefer one of these approaches:

1. **Recommended:** Run E2E against a real Convex **dev** deployment — set `VITE_CONVEX_URL` in `apps/web/.env.local`, seed data via dashboard or a test mutation, assert UI state in Playwright.
2. **UI-only tests:** Keep Playwright tests on static UI (theme, i18n, layout) without backend, as in the template today.
3. **Advanced mocking:** Intercept your deployment host explicitly, e.g. `*.convex.cloud` or the exact URL from `.env.local` — not generic `/api/` paths.

```ts
// Example: only if you must mock a specific HTTP endpoint (uncommon for Convex)
await page.route("https://your-project.convex.cloud/**", (route) => {
  route.fulfill({ status: 200, body: "{}" });
});
```

See [security-headers.md](./security-headers.md) for CSP when running production-like E2E builds.

## Next Steps

- Follow [agent-guidance.md](./agent-guidance.md) for AGENTS.md, Copilot, prompts, and ADR precedence
- Follow [.github/copilot-instructions.md](../.github/copilot-instructions.md) for coding standards and patterns
- Add Vitest and Playwright after the frontend scaffold
- See [ci-cd.md](./ci-cd.md) for GitHub Actions secrets, releases, and PR previews
- See [../README.md](../README.md) for development workflows
