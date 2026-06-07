# Environments and platform setup

How **development**, **pre-release**, and **production** map across Convex, Clerk, Vercel, domains, and GitHub Actions. CI/CD workflow details live in [ci-cd.md](./ci-cd.md).

**Recommended path:** run `bun run setup` after [getting-started.md](./getting-started.md) — it walks identity, Clerk, Convex, GitHub secrets, and Vercel with dashboard URLs and CLI commands. Manual steps below are fallbacks.

## Overview

| Tier            | Purpose                           | Convex / Clerk                    | Vercel domains (example)                                   |
| --------------- | --------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| **Development** | Local, PR CI, Playwright E2E      | Dev deployment, Clerk Development | `localhost:5173`, `localhost:4321`                         |
| **Pre-release** | Staging on fixed URLs before prod | Same as development               | `dev.example.com` (web), `dev.www.example.com` (marketing) |
| **Production**  | Customer-facing                   | Prod deployment, Clerk Production | `example.com` (web), `www.example.com` (marketing)         |

Replace `example.com` with your apex domain from [`.reactor/setup.json`](../.reactor/setup.json). Pre-release and local share the **dev** Convex database and Clerk test users — never production data.

## Tags and GitHub releases

One **GitHub release** per workflow run. Lane is encoded in the tag (and matches the pre-release checkbox):

| Lane        | Tag example                | GitHub release  |
| ----------- | -------------------------- | --------------- |
| Development | `dev-2026-06-07-18-55-37`  | **Pre-release** |
| Production  | `prod-2026-06-07-18-55-37` | Full release    |

Each tag points at a commit on `main` and deploys **Convex, web, and marketing** together. Release notes are repo-wide (merged PRs since the previous tag in the same lane).

**Deploy** reads the tag only — `dev-*` uses **repository secrets**; `prod-*` uses the GitHub **`production`** environment.

## Domains and DNS

For apex domain `example.com`, Reactor uses four public hostnames:

| Surface       | Pre-release (Preview) | Production        | Vercel project     |
| ------------- | --------------------- | ----------------- | ------------------ |
| **Web app**   | `dev.example.com`     | `example.com`     | `{repo}-web`       |
| **Marketing** | `dev.www.example.com` | `www.example.com` | `{repo}-marketing` |

### Setup wizard (DNS hints)

When you complete the **Vercel** step in `bun run setup`, the script:

1. Adds these hostnames to the matching Vercel projects (API — may fail if the domain is not yours yet; add manually in that case).
2. Prints **DNS (at your registrar)** with CNAME targets from the [Vercel API](https://vercel.com/docs/rest-api/endpoints#domain-configuration).

Re-run setup anytime; hostnames are derived from your saved apex domain.

### DNS at your registrar

Do this **once per hostname** after the domain is added in Vercel (**Project → Settings → Domains**). Exact targets are shown in the Vercel UI per domain — prefer those over generic examples.

| Hostname              | Typical record | Typical value / notes                                    |
| --------------------- | -------------- | -------------------------------------------------------- |
| `example.com`         | **A**          | `76.76.21.21` (Vercel apex — confirm in domain settings) |
| `www.example.com`     | **CNAME**      | `cname.vercel-dns.com` (or value shown in Vercel)        |
| `dev.example.com`     | **CNAME**      | `cname.vercel-dns.com` (or value from setup / Vercel)    |
| `dev.www.example.com` | **CNAME**      | `cname.vercel-dns.com` (or value from setup / Vercel)    |

**Checklist:**

1. Add each hostname in the correct Vercel project ([web](#vercel-web--marketing) vs marketing).
2. Create the DNS record at your registrar (Cloudflare, Route53, etc.). TTL `300` or automatic is fine.
3. Wait for propagation (minutes to hours). Vercel shows **Valid** when DNS is correct.
4. In Vercel **Domains**, assign:
   - `example.com` and `www.example.com` → **Production**
   - `dev.example.com` and `dev.www.example.com` → **Preview** (fixed staging URLs for `dev-*` deploys; no per-release alias in GitHub Actions)

No hostname values belong in GitHub secrets.

**Common issues:**

| Symptom                                           | Fix                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Apex `example.com` not validating with CNAME only | Use the **A** record Vercel shows for apex, or ALIAS/ANAME if your registrar supports it |
| `dev.*` serves an old deployment                  | Confirm the hostname is on **Preview**, not Production                                   |
| Clerk sign-in fails on staging                    | Add `https://dev.example.com` to Clerk **Development** allowed origins ([below](#clerk)) |

### Vercel (web + marketing)

**Automated (`bun run setup`):** creates or finds `{repo}-web` and `{repo}-marketing`, sets web `VITE_*` env vars, attaches domains, optional `gh secret set` for `VERCEL_*`.

**Manual:**

| Step               | URL / action                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| API token          | [vercel.com/account/tokens](https://vercel.com/account/tokens)                    |
| Import repo (×2)   | [vercel.com/new](https://vercel.com/new) — root `apps/web`, then `apps/marketing` |
| Dashboard          | [vercel.com/dashboard](https://vercel.com/dashboard)                              |
| Domain DNS records | Each project → **Settings → Domains** → select hostname                           |

Monorepo build settings live in each app's `vercel.json` (`installCommand` / `buildCommand` run from repo root). Git auto-deploy is off (`git.deploymentEnabled: false`); [GitHub Actions deploy](./ci-cd.md#vercel-web--marketing) ships builds.

| Hostname assignment                      | Vercel environment | Used when                                         |
| ---------------------------------------- | ------------------ | ------------------------------------------------- |
| `example.com`, `www.example.com`         | **Production**     | `prod-*` tags (`vercel deploy --prebuilt --prod`) |
| `dev.example.com`, `dev.www.example.com` | **Preview**        | `dev-*` tags (preview deploy, no `--prod`)        |

### Clerk

| Step            | Development instance                                              | Production instance          |
| --------------- | ----------------------------------------------------------------- | ---------------------------- |
| Create app      | [dashboard.clerk.com/apps](https://dashboard.clerk.com/apps)      | Same app → switch instance   |
| API keys        | [API keys](https://dashboard.clerk.com/last-active?path=api-keys) | Same path, Production toggle |
| Allowed origins | [Domains](https://dashboard.clerk.com/last-active?path=domains)   | Same path, Production toggle |

| Instance        | Allowed origins (for `example.com`)                |
| --------------- | -------------------------------------------------- |
| **Development** | `http://localhost:5173`, `https://dev.example.com` |
| **Production**  | `https://example.com`                              |

Setup copies **Development** keys into `apps/web/.env.local` and can derive the JWT issuer for Convex.

### Convex

| Step                     | Command / URL                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Dashboard                | [dashboard.convex.dev](https://dashboard.convex.dev)                                            |
| Link locally             | `bun run dev:convex` (first run: browser login)                                                 |
| Clerk issuer on **dev**  | `npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://….clerk.accounts.dev"`                     |
| Clerk issuer on **prod** | `npx convex env set CLERK_JWT_ISSUER_DOMAIN "…" --prod`                                         |
| CI deploy key (dev)      | `npx convex deployment token create github-ci` → GitHub `CONVEX_DEPLOY_KEY` (setup can do this) |

| Deployment      | Used when                                                              |
| --------------- | ---------------------------------------------------------------------- |
| **Development** | Local, E2E, `dev-*` tags (`CONVEX_DEPLOY_KEY` repository secret)       |
| **Production**  | `prod-*` tags (`CONVEX_DEPLOY_KEY` in GitHub `production` environment) |

Set `CLERK_JWT_ISSUER_DOMAIN` on **both** deployments (different Clerk issuer URLs for dev vs prod instances).

## GitHub Environments

Create one GitHub environment: **`production`** (prod credentials only).

| Scope                | Secrets                                                                          | Used when                  |
| -------------------- | -------------------------------------------------------------------------------- | -------------------------- |
| **Repository**       | Dev stack — CI, E2E, `dev-*` deploys ([ci-cd.md](./ci-cd.md#repository-secrets)) | Local, PR CI, E2E, `dev-*` |
| **`production` env** | Prod `CONVEX_DEPLOY_KEY`, `VITE_*`, `VERCEL_*` (same secret **names**)           | `prod-*` tags only         |

Setup can push **repository** secrets via `gh secret set` when you confirm after readiness.

**Production (`prod-*` tags):** the setup **Production** step creates the GitHub `production` environment if needed, sets Convex prod `CLERK_JWT_ISSUER_DOMAIN`, mints a prod `CONVEX_DEPLOY_KEY`, updates Vercel web **Production** env vars (when Vercel was configured), and runs `gh secret set --env production`. Requires **live** Clerk keys (`pk_live_` / `sk_live_`) and your Convex **production** deployment URL.

## Release flow

1. Merge to `main` with green PR CI.
2. **Release** → **Pre-release** checked (default) → tag `dev-…`, GitHub prerelease, deploy full stack to dev + Preview domains.
3. Verify on `dev.example.com` / `dev.www.example.com` (DNS and Clerk origins must be in place).
4. **Release** again with **Pre-release unchecked** → tag `prod-…`, full GitHub release, deploy full stack to prod.

Or **Deploy** an existing tag to redeploy without retagging.

## Related

- [getting-started.md](./getting-started.md) — `bun run setup` wizard
- [ci-cd.md](./ci-cd.md) — secrets tables, workflows
- [setup-automation.md](./setup-automation.md) — what setup automates vs manual
- [development.md](./development.md#e2e-tests-playwright)
