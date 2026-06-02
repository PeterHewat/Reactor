# Convex

Backend for the web app. Setup: [docs/getting-started.md](../docs/getting-started.md) (Clerk + `bun run dev:convex`).

```text
convex/
  _generated/
  schema.ts
  auth.config.ts    # CLERK_JWT_ISSUER_DOMAIN in Convex dashboard
  lib/auth.ts       # requireIdentity()
  tasks.ts          # sample — delete with the tasks slice
```

[Convex docs](https://docs.convex.dev/) · [Convex + Clerk](https://docs.convex.dev/auth/clerk)
