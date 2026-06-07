# CI/CD and deployments

## Workflows

| Workflow                                                | Purpose                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [ci.yml](../.github/workflows/ci.yml)                   | Lint, test, and build on pull requests to `main` (not re-run on merge)                                 |
| [release.yml](../.github/workflows/release.yml)         | Create GitHub release + deploy **new** tags                                                            |
| [deploy.yml](../.github/workflows/deploy.yml)           | **Deploy** — redeploy/rollback a tag to **production** or **pre-release** (also called from Release)   |
| [e2e.yml](../.github/workflows/e2e.yml)                 | Manual full Playwright (web and/or marketing); optional gate on Release                                |
| [sync-labels.yml](../.github/workflows/sync-labels.yml) | One-time or occasional: sync issue/PR labels ([source of truth](../.github/workflows/sync-labels.yml)) |

**New release:** Actions → **Release** → **Pre-release** checkbox (unchecked = production), optional E2E. One tag per run: `dev-2026-06-07-18-55-37` or `prod-2026-06-07-18-55-37`. Deploys Convex, web, and marketing. GitHub release gets `--prerelease` when the box is checked.

**Rollback / redeploy:** Actions → **Deploy** → tag (e.g. `dev-2026-06-07-18-55-37`).

**CI vs deploy:** [ci.yml](../.github/workflows/ci.yml) runs on **pull requests to `main` only** — merging does not start another run. [deploy.yml](../.github/workflows/deploy.yml) only builds and ships. [Release](../.github/workflows/release.yml) verifies green CI on the release commit or required checks on the merged PR before tagging.

**Web deploy codegen:** Web deploys run `bun scripts/generate-routes.ts` and `bun scripts/generate-convex.ts` before `vercel build`. `dev-*` tags use repository secrets; `prod-*` tags use the GitHub **`production`** environment.

**PR CI:** Lint, unit tests, and builds on pull requests. **Playwright E2E** is manual or runs from **Release** ([below](#manual-workflows)).

**No Turborepo/Nx:** Path-based jobs and [setup-bun](../.github/actions/setup-bun/action.yml) (`bun install --ignore-scripts` in CI; lifecycle scripts run only where needed). See [ADR-003](./adr/003-bun-native-monorepo-tasks-and-ci.md).

## Deployment tiers

| Lane            | Convex / Clerk    | Web domain (example) | Marketing (example)  | When                                                  |
| --------------- | ----------------- | -------------------- | -------------------- | ----------------------------------------------------- |
| **Local + E2E** | Dev / Development | `localhost:5173`     | `localhost:4321`     | Dev, Playwright, Release E2E                          |
| **Pre-release** | Dev / Development | `dev.domain.tld`     | `dev.www.domain.tld` | Tags `dev-*`; Release with **Pre-release** checked    |
| **Production**  | Prod / Production | `domain.tld`         | `www.domain.tld`     | Tags `prod-*`; Release with **Pre-release** unchecked |

Platform setup: **[environments.md](./environments.md)**.

## GitHub Environments

[deploy.yml](../.github/workflows/deploy.yml) sets `environment: production` only for `prod-*` tags. `dev-*` deploy jobs use **repository secrets** (no GitHub environment).

| Scope                | Secrets                            | Deploy behavior                                                   |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| **Repository**       | Dev stack (see below)              | `dev-*` — Convex dev; Vercel **preview** deploy (Preview domains) |
| **`production` env** | Prod stack (same secret **names**) | `prod-*` — Convex prod; Vercel **`--prod`** (Production domains)  |

Create **`production`** under **Settings → Environments** and add prod credentials there. Repository secrets power CI, E2E, and `dev-*` deploys. Full checklist: [environments.md](./environments.md#github-environments).

## CI behavior

Job definitions live in [ci.yml](../.github/workflows/ci.yml). Use **CI required** as the merge gate; other jobs may show **Success (skipped)** when paths or secrets do not apply.

**Docs-only PRs:** only **CI checks** runs Prettier; lint/typecheck/build are skipped.

**`CONVEX_DEPLOY_KEY` (repository):** `convex/_generated/` is not committed. The **checks** job runs `bun run check` (codegen + lint + typecheck). Other jobs that build or test the web app or Convex backend run `bun scripts/generate-convex.ts` and **fail** if the repository deploy key is missing. Use a **dev or preview** deploy key at repository level; keep the **production** key in the GitHub **`production`** environment only ([getting-started.md](./getting-started.md#5-github-actions-secrets)).

**Web job:** When `apps/web/**` changes, one job builds `@repo/web` and runs `test:coverage` for `@repo/web`, `@repo/ui-web`, and `@repo/utils` (plus utils integration tests). `@repo/web` and `@repo/ui-web` enforce minimum coverage percentages.

**Package / marketing / Convex jobs:** `test:coverage` for `@repo/config`, `@repo/env-core`, `@repo/marketing`, and `@repo/convex` when those paths change.

## Branch protection

CI runs on **pull requests only**, not on merge to `main`. Configure `main` so every change goes through a PR with green checks — do not rely on post-merge CI.

In **Settings → Branches** → add a rule for `main`:

| Setting                               | Recommendation                                    |
| ------------------------------------- | ------------------------------------------------- |
| Require a pull request before merging | On — no direct pushes to `main`                   |
| Require approvals                     | Per team policy (optional)                        |
| Require status checks to pass         | On — see table below                              |
| Require branches to be up to date     | On (optional; reduces drift)                      |
| Do not allow bypassing                | On for admins unless you accept unverified merges |

Suggested **required status checks** (from [ci.yml](../.github/workflows/ci.yml)):

| Check       | Job                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------- |
| CI required | `required` (job id; display name **CI required** — aggregates path-based jobs)                  |
| CI checks   | `checks` (detect, audit, secrets, format/lint/typecheck) — optional duplicate of the gate above |

`checks` replaces the former `detect-changes`, `security-audit`, `secrets-scan`, and `quality` jobs. Remove legacy required checks named `security-audit`, `secrets-scan`, or old job ids (`ci-required`, `ci-checks`) from branch protection if still listed.

Direct pushes to `main` (if allowed) will **not** run [ci.yml](../.github/workflows/ci.yml) and will block [Release](../.github/workflows/release.yml) until a PR-based check exists.

## E2E tests (Playwright)

Playwright does **not** run on pull requests. Run locally or via the manual workflow ([below](#manual-workflows)).

- **Local:** `bun run e2e:install` then `bun run --filter @repo/web e2e` (and/or `@repo/marketing`). See [development.md](./development.md#e2e-tests-playwright).
- **CI:** Actions → **E2E** → **Run workflow** ([e2e.yml](../.github/workflows/e2e.yml)). Choose the branch with **Use workflow from**. Toggle `run_web` / `run_marketing`.
- **Release:** enabled by default before deploy ([release.yml](../.github/workflows/release.yml)); always uses **dev** repository secrets, including before `prod-*` deploys.

The **E2E** workflow runs **UI-only** (`home`, `routing`) when Clerk/Convex secrets are missing; with secrets it runs the full suite including `tasks.e2e.ts`. Locally, `bun run --filter @repo/web e2e` does the same (UI-only without `.env.local` secrets).

**E2E targets dev:** `tasks.e2e.ts` uses `VITE_CONVEX_URL` (Convex **dev** deployment) and Clerk **development** keys — never production.

## Repository secrets

Configure in **Settings → Secrets and variables → Actions**. Used by PR CI and E2E — **development** stack values only.

| Secret                        | Description                                     | Where to find it                                                                                                                   |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`           | Deploy key for **CI/E2E codegen** (dev/preview) | Convex preview deploy key or dev deployment — **not** the production key ([environments.md](./environments.md#repository-secrets)) |
| `VITE_CONVEX_URL`             | Convex **dev** URL (E2E)                        | Convex Dashboard → dev deployment → Settings → URL                                                                                 |
| `VITE_CLERK_PUBLISHABLE_KEY`  | Clerk **development** publishable key (E2E)     | Clerk Dashboard → API Keys (Development)                                                                                           |
| `CLERK_SECRET_KEY`            | Clerk **development** secret (Playwright only)  | Clerk Dashboard → API Keys (Development)                                                                                           |
| `E2E_CLERK_USER_EMAIL`        | Dev test user for Playwright `clerk.signIn`     | Create in Clerk (Email + Password enabled); see [development.md](./development.md#e2e-tests-playwright)                            |
| `VERCEL_TOKEN`                | Vercel API token (pre-release deploy)           | Account Settings → Tokens                                                                                                          |
| `VERCEL_ORG_ID`               | Vercel team/user ID                             | Dashboard or `.vercel/project.json`                                                                                                |
| `VERCEL_WEB_PROJECT_ID`       | Web project ID                                  | Vercel project settings                                                                                                            |
| `VERCEL_MARKETING_PROJECT_ID` | Marketing project ID                            | Vercel project settings                                                                                                            |

### `production` environment secrets

Configure in **Settings → Environments → production → Environment secrets**. Used for `prod-*` tags. Same secret **names**, **production** values:

| Secret                        | Description                                 | Where to find it                                          |
| ----------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`           | Convex **production** deploy key            | Convex Dashboard → Production → Settings → Deploy Key     |
| `VITE_CONVEX_URL`             | Convex **prod** URL (web production deploy) | Convex Dashboard → production deployment → Settings → URL |
| `VITE_CLERK_PUBLISHABLE_KEY`  | Clerk **production** publishable key        | Clerk Dashboard → API Keys (Production)                   |
| `VERCEL_TOKEN`                | Vercel API token                            | Account Settings → Tokens                                 |
| `VERCEL_ORG_ID`               | Team or user ID                             | `.vercel/project.json` or dashboard                       |
| `VERCEL_WEB_PROJECT_ID`       | Project ID for `apps/web`                   | Vercel project settings                                   |
| `VERCEL_MARKETING_PROJECT_ID` | Project ID for `apps/marketing`             | Vercel project settings                                   |

See [environments.md](./environments.md) for Convex, Clerk, Vercel, and domain setup.

### Vercel (web + marketing)

Create **two** Vercel projects from this monorepo (Import Git Repository → set **Root Directory** to `apps/web` and `apps/marketing`). Each app has a `vercel.json` with monorepo install/build commands. Custom domains and env vars: [environments.md](./environments.md#vercel-configure-once).

**Web project (Vercel dashboard):** set `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` under **Production** (production deployment URLs and keys — mirror GitHub `production` environment).

**Release deploys:** [release.yml](../.github/workflows/release.yml) — one `workflow_dispatch` run creates a single tag, optionally runs E2E **before** deploy (dev secrets only), then ships the full stack (Convex → web and marketing in parallel).

**Vercel + GitHub Actions:** Deploy workflows run `vercel build` on the GitHub runner (full monorepo checkout), then `vercel deploy --prebuilt` — Vercel does not rebuild remotely. Disable automatic Vercel Git deployments: `git.deploymentEnabled: false` in each `vercel.json` ([Vercel docs](https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments)).

Deploy steps: [.github/actions/deploy-convex](../.github/actions/deploy-convex), [deploy-web-vercel](../.github/actions/deploy-web-vercel), [deploy-marketing-vercel](../.github/actions/deploy-marketing-vercel).

Tune CSP in `apps/web/vercel.json` for your Clerk domain ([prompts/security-review.md](../prompts/security-review.md)).

### Getting the Convex deploy key

**Production (deploy only):** Convex Dashboard → **Production** → Settings → Deploy Key → add as `CONVEX_DEPLOY_KEY` in GitHub **`production`** environment.

**CI / E2E (codegen):** use a dev or [preview](https://docs.convex.dev/production/hosting/preview-deployments) deploy key as repository `CONVEX_DEPLOY_KEY`. Do not duplicate the production key at repository level.

> Never commit secrets. Use GitHub repository or environment secrets ([environments.md](./environments.md)).

## Manual workflows

Heavy workflows run only from **Actions** → **Run workflow**. Choose the **branch** with GitHub’s **Use workflow from** dropdown when running E2E on a specific ref.

### Release

**Workflow:** [release.yml](../.github/workflows/release.yml) → **Release** (from `main` only)

| Input         | Purpose                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| `pre_release` | **Pre-release** checkbox (default on) — dev stack; unchecked = production release         |
| `run_e2e`     | Run Playwright **before** deploy via [e2e.yml](../.github/workflows/e2e.yml) (default on) |

Tags: `dev-2026-06-07-18-55-37` (development) or `prod-2026-06-07-18-55-37` (production). One GitHub release with repo-wide notes. E2E always uses **dev** repository secrets — never production credentials. Deploy order: **Convex**, then **web** and **marketing** in parallel.

### Deploy

**Workflow:** [deploy.yml](../.github/workflows/deploy.yml) → **Deploy** — redeploy or rollback (lane encoded in tag)

| Input | Purpose                                                                             |
| ----- | ----------------------------------------------------------------------------------- |
| `tag` | e.g. `dev-2026-06-07-18-55-37` or `prod-2026-06-07-18-55-37` (redeploys full stack) |

### E2E (Playwright)

**Workflow:** [e2e.yml](../.github/workflows/e2e.yml) → **E2E** (manual) or automatically from **Release** when `run_e2e` is enabled

| Input           | Purpose                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `run_web`       | `@repo/web` — UI-only without secrets; full suite (incl. `tasks.e2e.ts`) when repository secrets + `CONVEX_DEPLOY_KEY` are set |
| `run_marketing` | `@repo/marketing` Playwright                                                                                                   |

Full web E2E requires repository `CONVEX_DEPLOY_KEY` for codegen; UI-only does not. Does **not** run on PRs. Reports upload as workflow artifacts.

## PR labels and release notes

Release notes group **merged PRs** by label ([.github/release.yml](../.github/release.yml)). Squash-merge PRs so each PR becomes one commit on `main`. Use one primary label per PR (`enhancement`, `fix`, `breaking-change`, `security`, `documentation`, `dependencies`). Use `chore` for CI, workflows, and other internal changes; `test` or `ignore-for-release` when those fit better.

| Label                                                                                | Role                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| `enhancement`, `fix`, `breaking-change`, `security`, `documentation`, `dependencies` | Release note categories                       |
| `bug`                                                                                | Issues (also accepted on PRs alongside `fix`) |
| `test`, `chore`, `ignore-for-release`                                                | Excluded from release notes                   |
| `duplicate`, `invalid`, `wontfix`, `question`                                        | Issue triage                                  |

Dependabot applies `dependencies`, `github-actions`, `monorepo`, and `typescript`; bot PRs are excluded from notes by author.

### Sync labels to GitHub

Run once after creating the repo (and again when label names in [sync-labels.yml](../.github/workflows/sync-labels.yml) change):

In GitHub: Actions → Sync GitHub labels → Run workflow

Or from a machine with the [GitHub CLI](https://cli.github.com/) authenticated:

```bash
gh workflow run sync-labels.yml -R owner/repo
```

Safe to re-run (`gh label create --force` updates color/description). Use `chore` for CI and workflow changes. Keep labels aligned with [.github/release.yml](../.github/release.yml).
