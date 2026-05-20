# Platform architecture

How the application surfaces and shared packages fit together in this monorepo.

## Applications

| Platform  | App directory     | Role                                     |
| --------- | ----------------- | ---------------------------------------- |
| Web       | `apps/web/`       | Primary product UI (React 19 + Vite 8)   |
| Marketing | `apps/marketing/` | Static marketing site (Astro 6 + Vite 7) |

Backend lives in `convex/` at the repo root (sample schema/functions committed; adopters run `bunx convex dev` in their project).

## Shared packages

| Package               | Used by  | Responsibility                   |
| --------------------- | -------- | -------------------------------- |
| `packages/ui-web`     | Web      | shadcn-style React components    |
| `packages/utils`      | All apps | `cn()`, env helpers, theme, i18n |
| `packages/test-utils` | Tests    | Shared test helpers and mocks    |

Marketing `.astro` components live in `apps/marketing/src/components/`. Styling uses each app’s Tailwind config and CSS variables (`apps/marketing/src/styles/`).

Import shared code via workspace aliases — see [setup.md](./setup.md#path-aliases).

## Data and auth flow

```text
Browser
    → Clerk (auth session)
    → Convex client (useQuery / useMutation)
    → convex/ functions + schema
```

- **Web**: `ConvexProviderWithClerk` in `apps/web` (see setup guide).
- **Marketing**: Static site; no Convex client unless you add interactive islands later.

## Platform-specific conventions

| Concern       | Web / Marketing               |
| ------------- | ----------------------------- |
| Styling       | Tailwind v4                   |
| Class merging | `cn()` from `@repo/utils`     |
| Env vars      | `VITE_*` via `packages/utils` |
| Server state  | Convex hooks (web only)       |

## CI expectations

| Area      | CI job                 | Behavior                                                                                     |
| --------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Web       | `tests-web`, `web-e2e` | Vitest + Playwright (E2E opt-in via `e2e` label on PRs)                                      |
| Web       | `preview` workflow     | Convex + Vercel previews via `preview` label ([ci-cd.md](./ci-cd.md#pr-preview-deployments)) |
| Marketing | `tests-marketing`      | Vitest                                                                                       |
| Convex    | `tests-convex`         | Vitest + `convex-test` when `convex/**` changes                                              |

See [ci-cd.md](./ci-cd.md#ci-and-test-jobs) for details. Root lint/format/typecheck run when any app package changes.

## Further reading

- [Setup Guide](./setup.md) — first-time scaffolding and local dev
- [CI/CD](./ci-cd.md) — workflows, secrets, deploys
- [Architecture](./architecture.md) — business/system design (template)
- [README](../README.md) — commands and platform status matrix
