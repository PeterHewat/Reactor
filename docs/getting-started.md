# Getting started

Starter for a product web app (React + Vite), marketing site (Astro), and Convex + Clerk backend. **Production** (GitHub Actions, Vercel, releases) is in [ci-cd.md](./ci-cd.md).

[Prerequisites](./development.md#prerequisites): Git, Bun, Node.

## Local development

### 1. Create the repository

Use [**this template**](https://github.com/PeterHewat/Reactor/generate) on GitHub (not **Fork**), clone your repo, then:

```bash
bun install
bun scripts/setup.ts
```

`setup` copies env examples, sets `PRODUCT_NAME` and repo URLs from `git remote` when possible, updates README badges off the upstream template, and runs route codegen + `doctor`.

### 2. Clerk

[Create an application](https://dashboard.clerk.com).

- **Publishable key** (`pk_test_…`) — Clerk → Configure → API keys → **React** → `apps/web/.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`
- **Issuer** (`https://….clerk.accounts.dev`) — Clerk → Sessions → JWT templates → **Convex** preset → Convex deployment `CLERK_JWT_ISSUER_DOMAIN` (not in web `.env.local`)

`CLERK_SECRET_KEY` is for Playwright E2E later. Optional: [Google OAuth branding](https://console.cloud.google.com/apis/credentials/consent) if the consent screen should show your product name instead of “Clerk”.

### 3. Convex

On the **dev** deployment (Convex dashboard → Settings → Environment variables), set `CLERK_JWT_ISSUER_DOMAIN` to the Issuer from step 2, then:

```bash
bun run dev:convex
```

In `apps/web/.env.local`, set `VITE_CONVEX_URL` to your deployment URL (from the `dev:convex` banner or the Convex dashboard).

### 4. Run and verify `/tasks`

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks)
- Marketing: [localhost:4321](http://localhost:4321)

Run `bun scripts/doctor.ts` when env is complete. Commands: [development.md](./development.md#commands).

---

## Production

When `/tasks` works locally:

1. **GitHub Actions** — [secrets](./ci-cd.md#github-actions-secrets) (`CONVEX_DEPLOY_KEY`, Clerk/Convex URLs for CI), then `CI_STRICT=1`. Enable [branch protection](./ci-cd.md#branch-protection) on `main` (PR-only merges; required checks). Run [Sync GitHub labels](../.github/workflows/sync-labels.yml) once.
2. **Convex + Vercel** — production `CLERK_JWT_ISSUER_DOMAIN`; Vercel projects for `apps/web` and `apps/marketing` ([ci-cd.md](./ci-cd.md)). Tune [apps/web/vercel.json](../apps/web/vercel.json) CSP if your Clerk host differs ([security-review](../prompts/security-review.md)).
3. **Your product** — remove the sample tasks code and [docs/spec/v0/](./spec/v0/); add [product.md](./product.md), [architecture.md](./architecture.md), and specs under [docs/spec/](./spec/README.md). `setup` already updates README and `PRODUCT_NAME` when `git remote` is set. Optionally rename `@repo/*`.

Ship with the **Release** workflow ([ci-cd.md](./ci-cd.md)).
