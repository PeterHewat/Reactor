# v0 cross-cutting concerns

Shared behaviour for every v0 epic. Read this before [tasks.md](./tasks.md), [shell.md](./shell.md), or [marketing.md](./marketing.md).

## Authentication

- **Web app:** Clerk via `@clerk/react` when `VITE_CLERK_PUBLISHABLE_KEY` is set (`apps/web/src/providers/app-providers.tsx`).
- **Convex:** JWT validation via committed `convex/auth.config.ts` and dashboard var `CLERK_JWT_ISSUER_DOMAIN`.
- **Tasks (F-01):** All `api.tasks.*` handlers call `requireIdentity()` — tasks are scoped to `identity.subject`.
- **Shell (F-02):** Home route (`/`) renders without Clerk or Convex.

## Environment (degraded mode)

| Layer             | File                        | Required for demo                                       |
| ----------------- | --------------------------- | ------------------------------------------------------- |
| Convex CLI        | Root `.env.local`           | Tasks + typecheck                                       |
| Web (Vite)        | `apps/web/.env.local`       | Tasks (`VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`) |
| Marketing (Astro) | `apps/marketing/.env.local` | Optional (`PUBLIC_REPO_URL` for repo links)             |
| Convex dashboard  | `CLERK_JWT_ISSUER_DOMAIN`   | Tasks auth                                              |

When Convex/Clerk env is missing, the web app shows setup instructions (`BackendSetup`) instead of crashing. See [monorepo-structure.md](../../monorepo-structure.md) for the three-layer env model.

## Data model (tasks demo)

- Table: `tasks` — `userId`, `title`, optional `description`, `_creationTime`.
- Ownership: every query/mutation filters by authenticated `userId`.

## Status: Demo vs Shipped

- **Shipped:** production-ready capability you intend to keep (F-01 tasks slice).
- **Demo:** starter scaffolding to replace or extend (F-02 shell chrome, F-03 marketing site).
