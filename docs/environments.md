# Environments and platform setup

How **development**, **pre-release**, and **production** map across Convex, Clerk, Vercel, domains, and GitHub Actions. CI/CD workflow details live in [ci-cd.md](./ci-cd.md).

## Overview

| Tier            | Purpose                           | Convex / Clerk                    | Vercel domains (example)                                 |
| --------------- | --------------------------------- | --------------------------------- | -------------------------------------------------------- |
| **Development** | Local, PR CI, Playwright E2E      | Dev deployment, Clerk Development | `localhost:5173`, `localhost:4321`                       |
| **Pre-release** | Staging on fixed URLs before prod | Same as development               | `dev.domain.tld` (web), `dev.www.domain.tld` (marketing) |
| **Production**  | Customer-facing                   | Prod deployment, Clerk Production | `domain.tld` (web), `www.domain.tld` (marketing)         |

Replace `domain.tld` with your apex domain. Pre-release and local share the **dev** Convex database and Clerk test users — never production data.

## Tags and GitHub releases

One **GitHub release** per workflow run. Lane is encoded in the tag (and matches the pre-release checkbox):

| Lane        | Tag example                | GitHub release  |
| ----------- | -------------------------- | --------------- |
| Development | `dev-2026-06-07-18-55-37`  | **Pre-release** |
| Production  | `prod-2026-06-07-18-55-37` | Full release    |

Each tag points at a commit on `main` and deploys **Convex, web, and marketing** together. Release notes are repo-wide (merged PRs since the previous tag in the same lane).

**Deploy** reads the tag only — `dev-*` uses **repository secrets**; `prod-*` uses the GitHub **`production`** environment.

## Domains and DNS

| Surface       | Pre-release          | Production       |
| ------------- | -------------------- | ---------------- |
| **Web app**   | `dev.domain.tld`     | `domain.tld`     |
| **Marketing** | `dev.www.domain.tld` | `www.domain.tld` |

### Vercel (configure once)

1. Two projects: `apps/web`, `apps/marketing` ([ci-cd.md](./ci-cd.md#vercel-web--marketing)).
2. **Production** domains (`domain.tld`, `www.domain.tld`): assign to **Production** in each project. CI uses `vercel deploy --prebuilt --prod`.
3. **Pre-release** domains (`dev.domain.tld`, `dev.www.domain.tld`): assign to **Preview** in each project. CI uses a preview deploy (no `--prod`); Vercel routes the latest preview deployment to those domains — no per-run alias in Actions.

Add DNS CNAMEs once; no hostname secrets in GitHub.

### Clerk

| Instance        | Allowed origins (examples)                        |
| --------------- | ------------------------------------------------- |
| **Development** | `http://localhost:5173`, `https://dev.domain.tld` |
| **Production**  | `https://domain.tld`                              |

### Convex

| Deployment      | Used when                                                              |
| --------------- | ---------------------------------------------------------------------- |
| **Development** | Local, E2E, `dev-*` tags (`CONVEX_DEPLOY_KEY` repository secret)       |
| **Production**  | `prod-*` tags (`CONVEX_DEPLOY_KEY` in GitHub `production` environment) |

Set `CLERK_JWT_ISSUER_DOMAIN` on **both** Convex deployments.

## GitHub Environments

Create one GitHub environment: **`production`** (prod credentials only).

| Scope                | Secrets                                                                | Used when                  |
| -------------------- | ---------------------------------------------------------------------- | -------------------------- |
| **Repository**       | Dev stack — CI, E2E, `dev-*` deploys (see below)                       | Local, PR CI, E2E, `dev-*` |
| **`production` env** | Prod `CONVEX_DEPLOY_KEY`, `VITE_*`, `VERCEL_*` (same secret **names**) | `prod-*` tags only         |

### Repository secrets

CI, E2E, and pre-release deploy (`dev-*` tags):

| Secret                                                 | Purpose                                              |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`                                    | Dev deployment — CI codegen, E2E, pre-release Convex |
| `VITE_CONVEX_URL`                                      | Dev Convex URL                                       |
| `VITE_CLERK_PUBLISHABLE_KEY`                           | Clerk development publishable key                    |
| `CLERK_SECRET_KEY`                                     | Playwright                                           |
| `E2E_CLERK_USER_EMAIL`                                 | Playwright test user                                 |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_*_PROJECT_ID` | Pre-release Vercel deploys                           |

### `production` environment secrets

Same **names**, production values (see [ci-cd.md](./ci-cd.md#production-environment-secrets)).

## Release flow

1. Merge to `main` with green PR CI.
2. **Release** → **Pre-release** checked (default) → tag `dev-…`, GitHub prerelease, deploy full stack to dev + Preview domains.
3. Verify on `dev.domain.tld` / `dev.www.domain.tld`.
4. **Release** again with **Pre-release unchecked** → tag `prod-…`, full GitHub release, deploy full stack to prod.

Or **Deploy** an existing tag to redeploy without retagging.

## Related

- [getting-started.md](./getting-started.md)
- [ci-cd.md](./ci-cd.md)
- [development.md](./development.md#e2e-tests-playwright)
