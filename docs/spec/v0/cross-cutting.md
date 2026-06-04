# v0 cross-cutting concerns

Shared behaviour for every v0 epic. Read this before [tasks.md](./tasks.md), [shell.md](./shell.md), or [marketing.md](./marketing.md).

## Authentication

- **Web app:** Clerk via `@clerk/react` when `VITE_CLERK_PUBLISHABLE_KEY` is set (`apps/web/src/providers/app-providers.tsx`).
- **Convex:** JWT validation via `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard.
- **Tasks (F-01):** All `api.tasks.*` handlers call `requireIdentity()` — tasks are scoped to `identity.subject`.
- **Shell (F-02):** Home route (`/`) renders without Clerk or Convex.

## Environment (degraded mode)

| Layer            | Where                     | Required for demo                                       |
| ---------------- | ------------------------- | ------------------------------------------------------- |
| Web (Vite)       | `apps/web/.env.local`     | Tasks (`VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`) |
| Convex dashboard | `CLERK_JWT_ISSUER_DOMAIN` | Tasks auth                                              |

When Convex/Clerk env is missing, the web app shows setup instructions (`BackendSetup`) instead of crashing. Setup: [getting-started.md](../../getting-started.md).

## Data model (tasks demo)

- Table: `tasks` — `userId`, `title`, optional `description`, `_creationTime`.
- Ownership: every query/mutation filters by authenticated `userId`.

## Status: Demo vs Shipped

- **Shipped:** production-ready capability you intend to keep (F-01 tasks slice).
- **Demo:** starter scaffolding to replace or extend (F-02 shell chrome, F-03 marketing site).
