# Environments and platform setup

How **development**, **staging**, and **production** map across Convex, Clerk, Vercel, domains, and GitHub Actions. CI/CD workflow details live in [ci-cd.md](./ci-cd.md).

**Recommended path:** run `bun run setup` after [getting-started.md](./getting-started.md) — it walks identity, Clerk, Convex, GitHub secrets, and Vercel with dashboard URLs and CLI commands. Manual steps below are fallbacks.

## Overview

| Tier            | Purpose                | Convex / Clerk                    | Vercel domains (example)                                           |
| --------------- | ---------------------- | --------------------------------- | ------------------------------------------------------------------ |
| **Development** | Local, PR CI           | Dev deployment, Clerk Development | `localhost:5173`, `localhost:4321`                                 |
| **Staging**     | Pre-prod on fixed URLs | Same as development               | `preview.example.com` (web), `preview.www.example.com` (marketing) |
| **Production**  | Customer-facing        | Prod deployment, Clerk Production | `example.com` (web), `www.example.com` (marketing)                 |

Replace `example.com` with your apex domain from [`.reactor/setup.json`](../.reactor/setup.json). Staging and local share the **dev** Convex database and Clerk test users — never production data.

## Deploy triggers

| Event                | What ships | Stack                                                            |
| -------------------- | ---------- | ---------------------------------------------------------------- |
| **Merge to `main`**  | Staging    | Convex dev (GitHub Actions) + web/marketing (Vercel Git) + E2E   |
| **Release workflow** | Production | `release-*` tag → Convex prod + Vercel `--prod` (GitHub Actions) |

There is no `preview-*` release tag. Staging always reflects the latest merge to `main`.

## Domains and DNS

For apex domain `example.com`, Reactor uses four public hostnames:

| Surface       | Staging (Preview)         | Production        | Vercel project             |
| ------------- | ------------------------- | ----------------- | -------------------------- |
| **Web app**   | `preview.example.com`     | `example.com`     | `{product-slug}-web`       |
| **Marketing** | `preview.www.example.com` | `www.example.com` | `{product-slug}-marketing` |

### DNS (at your registrar)

| Hostname                  | Record type | Typical value                                         |
| ------------------------- | ----------- | ----------------------------------------------------- |
| `example.com`             | **A**       | Vercel apex IP (from setup / Vercel Domains UI)       |
| `www.example.com`         | **CNAME**   | `cname.vercel-dns.com` (or value shown in Vercel)     |
| `preview.example.com`     | **CNAME**   | `cname.vercel-dns.com` (or value from setup / Vercel) |
| `preview.www.example.com` | **CNAME**   | `cname.vercel-dns.com` (or value from setup / Vercel) |

**Checklist:**

1. Add each hostname in the correct Vercel project ([web](#vercel-web--marketing) vs marketing).
2. Create the DNS record at your registrar. TTL `300` or automatic is fine.
3. Wait for propagation. Vercel shows **Valid** when DNS is correct.
4. Confirm:
   - `example.com` and `www.example.com` → **Production** (updated only by Release workflow)
   - `preview.example.com` and `preview.www.example.com` → git branch **`main`** (Vercel Preview deploys on merge)

### Vercel (web + marketing)

**Automated (`bun run setup`):** creates or finds Git-linked `{product-slug}-web` and `{product-slug}-marketing`, sets web `VITE_*` env vars, attaches domains, optional `gh secret set` for `VERCEL_*`.

**Git staging model:**

1. Connect each project to your GitHub repo (root `apps/web`, `apps/marketing`).
2. **Production Branch** = `production` (not `main`) — create an empty `production` branch once if needed.
3. Merges to **`main`** deploy **Preview** builds to `preview.*` hostnames.
4. **Release** workflow deploys production domains via `vercel deploy --prod` in GitHub Actions.
5. `ignoreCommand` in each `vercel.json` builds on **`main` only** (skips PR branch deploys).

| Hostname assignment                              | How it updates                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `example.com`, `www.example.com`                 | **Release** → `release-*` tag → GitHub Actions `vercel deploy --prod` |
| `preview.example.com`, `preview.www.example.com` | **Merge to `main`** → Vercel Git Preview deploy (branch `main`)       |

Monorepo build settings live in each app's `vercel.json`. Production never auto-deploys from `main` when Production Branch is `production`.

**Not production:** `preview.*` uses Development Clerk keys and dev Convex. `example.com` / `www` use Production keys and prod Convex.

### Clerk

| Instance        | Allowed origins (for `example.com`)                    |
| --------------- | ------------------------------------------------------ |
| **Development** | `http://localhost:5173`, `https://preview.example.com` |
| **Production**  | `https://example.com`                                  |

### Convex

| Deployment      | Used when                                                             |
| --------------- | --------------------------------------------------------------------- |
| **Development** | Local, PR CI, merge to `main` (`CONVEX_DEPLOY_KEY` repository secret) |
| **Production**  | `release-*` releases (`CONVEX_DEPLOY_KEY` in GitHub `production` env) |

### GitHub environments

| Scope                | Secrets    | Used for                                                     |
| -------------------- | ---------- | ------------------------------------------------------------ |
| **Repository**       | Dev stack  | PR CI, Staging (Convex + E2E on `main`), Vercel Git env vars |
| **`production` env** | Prod stack | `release-*` Release deploys only                             |

Details: [ci-cd.md](./ci-cd.md#repository-secrets).

## First-time checklist

1. `bun run setup` through Clerk, Convex, Vercel, GitHub secrets.
2. Vercel: Production Branch = `production`; `preview.*` on branch `main`.
3. DNS valid for all four hostnames.
4. Merge a PR to `main` → **Staging** workflow green (Convex + E2E); Vercel deploys staging URLs.
5. **Release** workflow → `release-*` tag → production.

---

## Next

- [ci-cd.md](./ci-cd.md)
- [getting-started.md](./getting-started.md)
- [development.md](./development.md#e2e-tests-playwright)
