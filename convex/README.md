# Convex Backend

This folder contains the Convex backend for the application.

> **Template note:** Sample schema and functions are committed so you can copy the pattern. Full onboarding (Clerk **Issuer**, env vars, `dev:convex`) is in [docs/getting-started.md](../docs/getting-started.md) §2–4 — follow that before expecting `bun run dev:convex` to succeed.
>
> **Security:** All task queries and mutations require authentication. Tasks are scoped to the signed-in user (`userId`). There are no unauthenticated read/write endpoints.

## Quick link

From the **repository root** after Clerk + Convex env are set:

```bash
bun run dev:convex
```

Codegen: keep `dev:convex` running, or run `bun scripts/generate-convex.ts`.

## Clerk → Convex (`CLERK_JWT_ISSUER_DOMAIN`)

`auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` from the **Convex dashboard** (not from `.env.local`).

| Where                                                                                  | What                                                                                      |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Clerk → **Configure** → **JWT templates** → **+ Add new template** → **Convex** preset | Creates template named `convex`; copy **Issuer** URL                                      |
| Convex → **Settings** → **Environment variables**                                      | `CLERK_JWT_ISSUER_DOMAIN` = that **Issuer** URL                                           |
| `apps/web/.env.local`                                                                  | `VITE_CLERK_PUBLISHABLE_KEY` from Clerk → **API keys** → quick copy → framework **React** |

Clerk’s UI says **Issuer** on the template, not “JWT issuer”. Do not use a blank JWT template.

## Environment variables (checklist)

### Root `.env.local` (from `bun run dev:convex`)

```text
CONVEX_DEPLOYMENT=dev:your-project-name
```

### `apps/web/.env.local`

```text
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_REPO_URL=https://github.com/YOUR_ORG/YOUR_REPO
```

### Convex dashboard

```text
CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-instance>.clerk.accounts.dev
```

(Set on **dev** and **production** deployments when you ship.)

## Use authentication in functions

Task functions use `requireIdentity()` from `convex/lib/auth.ts`:

```ts
import { query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const getMyData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return ctx.db
      .query("data")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
  },
});
```

Web providers: `apps/web/src/providers/app-providers.tsx` (`ClerkProvider` + `ConvexProviderWithClerk`). Sign-in: `/login`.

## File structure

```text
convex/
  _generated/              # Auto-generated (do not edit)
  schema.ts
  auth.config.ts           # Committed; needs CLERK_JWT_ISSUER_DOMAIN in dashboard
  auth.config.ts.example
  lib/
  tasks.ts                 # Sample authenticated CRUD
```

## Resources

- [Getting started §2–4](../docs/getting-started.md)
- [Convex docs](https://docs.convex.dev/)
- [Convex + Clerk](https://docs.convex.dev/auth/clerk) (upstream reference; Reactor steps above are sufficient for this template)
