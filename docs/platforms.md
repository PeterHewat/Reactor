# Platform architecture

How the application surfaces and shared packages fit together in this monorepo. **Onboarding:** [README](../README.md) → [getting-started.md](./getting-started.md). **Commands:** [package.json](../package.json) or [getting-started.md#commands](./getting-started.md#commands).

## Surfaces

| Surface   | Location          | Hosted with                          |
| --------- | ----------------- | ------------------------------------ |
| Web       | `apps/web/`       | Vercel (`web-v*` releases)           |
| Marketing | `apps/marketing/` | Vercel (`marketing-v*` releases)     |
| Backend   | `convex/`         | Convex (`convex-v*` releases)        |
| Auth      | Clerk dashboard   | Wired into web + Convex JWT settings |

## Tech stack

| Layer            | Choice                                                   |
| ---------------- | -------------------------------------------------------- |
| Web app          | React 19, Vite 8, Tailwind CSS v4, Zustand (theme, i18n) |
| Marketing        | Astro 6, Vite 7, Tailwind CSS v4                         |
| Backend          | Convex (`convex/`), Clerk auth                           |
| Server state     | Convex `useQuery` / `useMutation` (web)                  |
| Shared UI        | `packages/ui-web` (shadcn-style)                         |
| Shared utilities | `packages/utils` (`cn`, env, theme, i18n)                |
| Design tokens    | `packages/tokens` (CSS variables; web + marketing)       |
| Tests            | Vitest (unit), Playwright (E2E)                          |

## Shared packages

| Package               | Used by                               | Responsibility                   |
| --------------------- | ------------------------------------- | -------------------------------- |
| `packages/tokens`     | Web, marketing                        | Shared CSS design tokens         |
| `packages/ui-web`     | Web                                   | shadcn-style React components    |
| `packages/utils`      | Web (`@repo/web`)                     | `cn()`, env helpers, theme, i18n |
| `packages/test-utils` | Tests                                 | Shared test helpers and mocks    |
| `packages/config`     | Vite/Vitest (not a workspace package) | Path aliases                     |

Marketing `.astro` components live in `apps/marketing/src/components/`. Styling uses each app’s Tailwind config and CSS variables (`apps/marketing/src/styles/`).

Import shared code via workspace aliases — see [monorepo-structure.md](./monorepo-structure.md#path-aliases).

## Data and auth flow

```text
Browser
    → Clerk (auth session)
    → Convex client (useQuery / useMutation)
    → convex/ functions + schema
```

- **Web**: `ConvexProviderWithClerk` in `apps/web/src/providers/app-providers.tsx` when env vars are set (see [README](../README.md#resources)).
- **Marketing**: Static site; no Convex client unless you add interactive islands later.

## Platform-specific conventions

| Concern       | Web / Marketing                                                    |
| ------------- | ------------------------------------------------------------------ |
| Styling       | Tailwind v4                                                        |
| Class merging | `cn()` from `@repo/utils`                                          |
| Env vars      | Web: `apps/web/src/env.ts` + `VITE_*`; Convex: `convex/lib/env.ts` |
| Server state  | Convex hooks (web only)                                            |

## CI

Lint, test, build, and deploy workflows: [ci-cd.md](./ci-cd.md). Opt-in PR labels: `e2e`, `preview`.

## Further reading

Doc map: [README](../README.md#resources). Also [development.md](./development.md), [monorepo-structure.md](./monorepo-structure.md), [ci-cd.md](./ci-cd.md), [architecture.md](./architecture.md), [CONTRIBUTING.md](../CONTRIBUTING.md).
