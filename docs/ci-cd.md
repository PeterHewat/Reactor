# CI/CD and deployments

## Workflows

| Workflow                                                | Purpose                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [ci.yml](../.github/workflows/ci.yml)                   | Lint, test, and build on pull requests to `main` (not re-run on merge)                                 |
| [release.yml](../.github/workflows/release.yml)         | Create GitHub release + deploy **new** tags                                                            |
| [deploy.yml](../.github/workflows/deploy.yml)           | **Deploy Production** — redeploy or rollback an existing tag (e.g. `web-v1.0.0`)                       |
| [preview.yml](../.github/workflows/preview.yml)         | **Deploy Preview** — manual branch previews (`workflow_dispatch`)                                      |
| [e2e.yml](../.github/workflows/e2e.yml)                 | Manual full Playwright (web and/or marketing)                                                          |
| [sync-labels.yml](../.github/workflows/sync-labels.yml) | One-time or occasional: sync issue/PR labels ([source of truth](../.github/workflows/sync-labels.yml)) |

**New release:** Actions → **Release** → Run workflow (scope + version bump). Release notes are auto-generated from merged PRs using [.github/release.yml](../.github/release.yml) (label categories, exclusions).

**Rollback / redeploy:** Actions → **Deploy Production** → Run workflow → tag `web-v1.0.0` (checks out that git tag, rebuilds, deploys to production).

**CI vs deploy:** [ci.yml](../.github/workflows/ci.yml) runs on **pull requests to `main` only** — merging does not start another run. [deploy.yml](../.github/workflows/deploy.yml) only builds and ships. [Release](../.github/workflows/release.yml) verifies green CI on the release commit or required checks on the merged PR before tagging.

**Web deploy codegen:** Production and preview web deploys run `bun scripts/generate-routes.ts` and `bun scripts/generate-convex.ts` before `vercel build` (`convex/_generated/` is not committed). Requires `CONVEX_DEPLOY_KEY` (production) or `CONVEX_PREVIEW_DEPLOY_KEY` (previews).

**PR CI:** Lint, unit tests, builds, and **web E2E smoke** on pull requests. **Full E2E** and **preview deploys** are manual workflows ([below](#manual-workflows)).

**No Turborepo/Nx:** Path-based jobs and [setup-bun](../.github/actions/setup-bun/action.yml). See [ADR-003](./adr/003-bun-native-monorepo-tasks-and-ci.md).

## CI behavior

Job definitions live in [ci.yml](../.github/workflows/ci.yml). Use **CI required** as the merge gate; other jobs may show **Success (skipped)** when paths or secrets do not apply.

**Docs-only PRs:** only **quality** runs Prettier; lint/typecheck/build are skipped.

**Without `CONVEX_DEPLOY_KEY`:** `convex/_generated/` is not committed. Typecheck, web build, `@repo/web` tests, Convex tests, and web E2E run `bun scripts/generate-convex.ts` when the key exists; otherwise they log a `::notice::` and exit 0. Smoke E2E also needs Clerk/Convex URL secrets when it runs.

### Optional CI guardrails

Repository variables (**Settings → Secrets and variables → Actions → Variables**) change behavior only when secrets are **missing** or removed:

| Variable                    | When set to `1`                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CI_STRICT`                 | Fail quality typecheck, build-web, `@repo/web` tests, and Convex tests if `CONVEX_DEPLOY_KEY` is not configured (default: skip with notice, exit 0). |
| `E2E_SMOKE_REQUIRE_SECRETS` | Fail `web-e2e-smoke` if smoke secrets are missing (default: skip Playwright, job still passes).                                                      |

Set `CI_STRICT=1` once `CONVEX_DEPLOY_KEY` exists ([getting-started.md](./getting-started.md)) so missing keys fail CI instead of skipping.

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

| Check          | Job                                        |
| -------------- | ------------------------------------------ |
| CI required    | `ci-required` (aggregates path-based jobs) |
| Security audit | `security-audit`                           |
| Secrets scan   | `secrets-scan`                             |

Direct pushes to `main` (if allowed) will **not** run [ci.yml](../.github/workflows/ci.yml) and will block [Release](../.github/workflows/release.yml) until a PR-based check exists.

## E2E tests (Playwright)

- **Smoke (tasks + Clerk + Convex):** `bun run --filter @repo/web e2e:smoke` — runs on every PR when `apps/web/**` changes (`web-e2e-smoke`). Configure `CONVEX_DEPLOY_KEY` (codegen), `CLERK_SECRET_KEY`, `E2E_CLERK_USER_EMAIL`, `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` in GitHub Actions; see [development.md](./development.md#e2e-smoke-tasks).
- **Full suite:** `bunx playwright install chromium` once, then `bun run --filter @repo/web e2e` (or `@repo/marketing`)
- **CI (full):** Actions → **E2E NRT** → Run workflow — pick branch via **Use workflow from** and select suites ([e2e.yml](../.github/workflows/e2e.yml)); not merge-blocking
- **Naming:** `*.e2e.ts` (full), `*.smoke.e2e.ts` (smoke)

**Smoke deployment:** `web-e2e-smoke` creates and deletes tasks against whatever deployment `VITE_CONVEX_URL` points to. In GitHub Actions, set that secret to your **dev** deployment URL (the same one you use locally after `bun run dev:convex`) — **not** production after you ship. Use a dedicated Clerk test user (`E2E_CLERK_USER_EMAIL`). Vercel production/preview use their own `VITE_CONVEX_URL` in the Vercel dashboard; do not reuse the production URL for CI smoke.

## GitHub Actions secrets

Configure these in the repository: **Settings → Secrets and variables → Actions**.

### Required secrets (adopter projects)

| Secret                       | Description                                                       | Where to find it                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`          | Convex **production** deploy key (releases)                       | Convex Dashboard → Settings → Deploy Key                                                                            |
| `CONVEX_PREVIEW_DEPLOY_KEY`  | Convex **preview** deploy key (manual Preview workflow)           | Convex Dashboard → Settings → [Preview deploy keys](https://docs.convex.dev/production/hosting/preview-deployments) |
| `VITE_CONVEX_URL`            | Convex URL for **CI smoke only** (dev deployment; not production) | Convex Dashboard → dev deployment → Settings → URL                                                                  |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                                             | Clerk Dashboard → API Keys                                                                                          |
| `CLERK_SECRET_KEY`           | Clerk secret key (E2E smoke only)                                 | Clerk Dashboard → API Keys — never expose in the client                                                             |
| `E2E_CLERK_USER_EMAIL`       | Dev test user for Playwright `clerk.signIn`                       | Create in Clerk (Email + Password enabled); see [development.md](./development.md#e2e-smoke-tasks)                  |

### Vercel (web + marketing)

Create **two** Vercel projects from this monorepo (Import Git Repository → set **Root Directory** to `apps/web` and `apps/marketing`). Each app has a `vercel.json` with monorepo install/build commands.

| Secret                        | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `VERCEL_TOKEN`                | Vercel API token (Account Settings → Tokens)          |
| `VERCEL_ORG_ID`               | Team or user ID (`.vercel/project.json` or dashboard) |
| `VERCEL_WEB_PROJECT_ID`       | Project ID for `apps/web`                             |
| `VERCEL_MARKETING_PROJECT_ID` | Project ID for `apps/marketing`                       |

**Web project:** add `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in Vercel → Project → Settings → Environment Variables (Production + Preview).

**Release deploys:** [release.yml](../.github/workflows/release.yml) only — one `workflow_dispatch` run creates the release and deploys. No PAT, no `production` environment, no second workflow.

**Vercel + GitHub Actions:** Deploy workflows run `vercel build` on the GitHub runner (full monorepo checkout), then `vercel deploy --prebuilt` — Vercel does not rebuild remotely. Disable automatic Vercel Git deployments: `git.deploymentEnabled: false` in each `vercel.json` ([Vercel docs](https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments)).

Tune CSP in `apps/web/vercel.json` for your Clerk domain ([prompts/security-review.md](../prompts/security-review.md)).

### Getting the Convex deploy key

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to Settings → Deploy Key
4. Click **Generate Deploy Key**
5. Copy the key and add it as `CONVEX_DEPLOY_KEY` in GitHub Secrets

> Never commit secrets. Use GitHub Secrets or environment variables for sensitive values.

## Manual workflows

Heavy workflows run only from **Actions** → **Run workflow**. Choose the **branch** with GitHub’s **Use workflow from** dropdown; that ref is checked out and deployed/tested (no separate branch text field).

### Deploy Preview

**Workflow:** [preview.yml](../.github/workflows/preview.yml) → **Deploy Preview**

| Input              | Purpose                             |
| ------------------ | ----------------------------------- |
| `deploy_convex`    | Create/update Convex preview        |
| `deploy_web`       | Vercel preview for `apps/web`       |
| `deploy_marketing` | Vercel preview for `apps/marketing` |

**Convex preview name** is derived from the branch (`manual-<slug>`). **PR comments:** if exactly one open PR uses that branch head ref, the workflow posts or updates the preview comment; otherwise URLs appear only in the job summary.

**Secrets:** `CONVEX_PREVIEW_DEPLOY_KEY`, `VERCEL_*`, `VITE_CLERK_PUBLISHABLE_KEY` for web. Web without Convex preview can use `VITE_CONVEX_URL` (dev deployment) in secrets.

Preview Convex deployments expire automatically ([Convex preview docs](https://docs.convex.dev/production/hosting/preview-deployments)).

### Full E2E

**Workflow:** [e2e.yml](../.github/workflows/e2e.yml) → **E2E NRT**

| Input           | Purpose                      |
| --------------- | ---------------------------- |
| `run_web`       | `@repo/web` Playwright suite |
| `run_marketing` | `@repo/marketing` Playwright |

Does **not** block PR merge. Reports upload as workflow artifacts.

## PR labels and release notes

Release notes group **merged PRs** by label ([release.yml](../.github/release.yml)). Squash-merge PRs so each PR becomes one commit on `main`. Use one primary label per PR (`enhancement`, `fix`, `breaking-change`, `security`, `documentation`, `dependencies`). Use `chore` for CI, workflows, and other internal changes; `test` or `ignore-for-release` when those fit better.

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
