# CI/CD and deployments

## Workflows

| Workflow                                                | Purpose                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [ci.yml](../.github/workflows/ci.yml)                   | Lint, test, and build on every PR/push to `main`                                                       |
| [release.yml](../.github/workflows/release.yml)         | Create GitHub release + deploy **new** tags                                                            |
| [deploy.yml](../.github/workflows/deploy.yml)           | Deploy or **rollback** to an existing tag (e.g. `web-v1.0.0`)                                          |
| [preview.yml](../.github/workflows/preview.yml)         | PR previews when the `preview` label is added (opt-in)                                                 |
| [sync-labels.yml](../.github/workflows/sync-labels.yml) | One-time or occasional: sync issue/PR labels ([source of truth](../.github/workflows/sync-labels.yml)) |

**New release:** Actions → **Release** → Run workflow (scope + version bump). Release notes are auto-generated from merged PRs using [.github/release.yml](../.github/release.yml) (label categories, exclusions).

**Rollback / redeploy:** Actions → **Deploy** → Run workflow → tag `web-v1.0.0` (checks out that git tag, rebuilds, deploys to production).

**CI vs deploy:** [ci.yml](../.github/workflows/ci.yml) runs lint, format, typecheck, and tests on PRs and `main`. [deploy.yml](../.github/workflows/deploy.yml) only builds and ships. The [Release](../.github/workflows/release.yml) workflow requires a successful `ci.yml` run for the **release commit** (`github.sha`) before creating tags; still run Release only when you intend to ship.

**Web deploy codegen:** Production and preview web deploys run `bun scripts/generate-routes.ts` and `bun scripts/generate-convex.ts` before `vercel build` (`convex/_generated/` is not committed). Requires `CONVEX_DEPLOY_KEY` (production) or `CONVEX_PREVIEW_DEPLOY_KEY` (previews).

**Full E2E on `main`:** When `apps/web/**` changes, [ci.yml](../.github/workflows/ci.yml) runs the full Playwright suite on pushes to `main`; failures fail **CI required** (smoke runs on every web PR; full suite is label-opt-in on PRs via `e2e`).

**No Turborepo/Nx:** Path-based jobs and [setup-bun](../.github/actions/setup-bun/action.yml). See [ADR-003](./adr/003-bun-native-monorepo-tasks-and-ci.md).

## CI behavior

Job definitions live in [ci.yml](../.github/workflows/ci.yml). Use **CI required** as the merge gate; other jobs may show **Success (skipped)** when paths or secrets do not apply.

| Label     | Effect                                                             |
| --------- | ------------------------------------------------------------------ |
| `e2e`     | Full Playwright on web/marketing when those paths change           |
| `preview` | Convex + Vercel preview deploys ([below](#pr-preview-deployments)) |

**Docs-only PRs:** only **quality** runs Prettier; lint/typecheck/build are skipped.

**Without `CONVEX_DEPLOY_KEY`:** `convex/_generated/` is not committed. Typecheck, web build, `@repo/web` tests, Convex tests, and web E2E run `bun scripts/generate-convex.ts` when the key exists; otherwise they log a `::notice::` and exit 0. Smoke E2E also needs Clerk/Convex URL secrets when it runs.

### Optional CI guardrails

Repository variables (**Settings → Secrets and variables → Actions → Variables**) change behavior only when secrets are **missing** or removed:

| Variable                    | When set to `1`                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CI_STRICT`                 | Fail quality typecheck, build-web, `@repo/web` tests, `web-e2e`, and Convex tests if `CONVEX_DEPLOY_KEY` is not configured (default: skip with notice, exit 0). |
| `E2E_SMOKE_REQUIRE_SECRETS` | Fail `web-e2e-smoke` if smoke secrets are missing (default: skip Playwright, job still passes).                                                                 |

Set `CI_STRICT=1` once `CONVEX_DEPLOY_KEY` exists ([getting-started.md](./getting-started.md)) so missing keys fail CI instead of skipping.

## Branch protection

After configuring secrets, protect `main` in **Settings → Branches**. Suggested required checks:

| Check          | Job                                        |
| -------------- | ------------------------------------------ |
| CI required    | `ci-required` (aggregates path-based jobs) |
| Security audit | `security-audit`                           |
| Secrets scan   | `secrets-scan`                             |

## E2E tests (Playwright)

- **Smoke (tasks + Clerk + Convex):** `bun run --filter @repo/web e2e:smoke` — runs on every PR when `apps/web/**` changes (`web-e2e-smoke`). Configure `CONVEX_DEPLOY_KEY` (codegen), `CLERK_SECRET_KEY`, `E2E_CLERK_USER_EMAIL`, `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` in GitHub Actions; see [development.md](./development.md#e2e-smoke-tasks).
- **Full suite:** `bunx playwright install chromium` once, then `bun run --filter @repo/web e2e` (or `@repo/marketing`)
- **CI (full):** Add the **`e2e`** label on a PR; runs when web or marketing paths change (after the matching build job)
- **Naming:** `*.e2e.ts` (full), `*.smoke.e2e.ts` (smoke)

## GitHub Actions secrets

Configure these in the repository: **Settings → Secrets and variables → Actions**.

### Required secrets (adopter projects)

| Secret                       | Description                                        | Where to find it                                                                                                    |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`          | Convex **production** deploy key (releases)        | Convex Dashboard → Settings → Deploy Key                                                                            |
| `CONVEX_PREVIEW_DEPLOY_KEY`  | Convex **preview** deploy key (PR `preview` label) | Convex Dashboard → Settings → [Preview deploy keys](https://docs.convex.dev/production/hosting/preview-deployments) |
| `VITE_CONVEX_URL`            | Convex deployment URL                              | Convex Dashboard → Settings → URL                                                                                   |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                              | Clerk Dashboard → API Keys                                                                                          |
| `CLERK_SECRET_KEY`           | Clerk secret key (E2E smoke only)                  | Clerk Dashboard → API Keys — never expose in the client                                                             |
| `E2E_CLERK_USER_EMAIL`       | Dev test user for Playwright `clerk.signIn`        | Create in Clerk (Email + Password enabled); see [development.md](./development.md#e2e-smoke-tasks)                  |

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

## PR preview deployments

Opt-in previews for pull requests. Same pattern as the `e2e` label: add the **`preview`** label on a PR to trigger [preview.yml](../.github/workflows/preview.yml). Push new commits while the label is present to redeploy.

| Changed paths                | What runs                                                              |
| ---------------------------- | ---------------------------------------------------------------------- |
| `convex/**` or `apps/web/**` | Convex preview deployment named `pr-<number>`; web build uses that URL |
| `apps/marketing/**`          | Vercel preview for marketing (static; no Convex)                       |

**Secrets:** `CONVEX_PREVIEW_DEPLOY_KEY` (not the production `CONVEX_DEPLOY_KEY`), plus `VERCEL_*` and `VITE_CLERK_PUBLISHABLE_KEY` for web previews.

**Convex preview key:** Convex Dashboard → Project → Settings → **Generate Preview Deploy Key** → store as `CONVEX_PREVIEW_DEPLOY_KEY`. Production Convex deploys use `CONVEX_DEPLOY_KEY` via the Release workflow (`convex` scope).

**Clerk:** Add your Vercel preview URL pattern to allowed origins if you test sign-in on previews.

The workflow posts (or updates) a single PR comment with Convex and Vercel links. Preview Convex deployments expire automatically ([Convex preview docs](https://docs.convex.dev/production/hosting/preview-deployments)).

## PR labels and release notes

Release notes group **merged PRs** by label ([release.yml](../.github/release.yml)). Squash-merge PRs so each PR becomes one commit on `main`. Use one primary label per PR (`enhancement`, `fix`, `breaking-change`, `security`, `documentation`, `dependencies`). Use `test`, `chore`, or `ignore-for-release` for work that should not appear in release notes.

| Label                                                                                | Role                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| `enhancement`, `fix`, `breaking-change`, `security`, `documentation`, `dependencies` | Release note categories                       |
| `bug`                                                                                | Issues (also accepted on PRs alongside `fix`) |
| `test`, `chore`, `ignore-for-release`                                                | Excluded from release notes                   |
| `e2e`, `preview`                                                                     | Opt-in CI/preview workflows (see above)       |
| `duplicate`, `invalid`, `wontfix`, `question`                                        | Issue triage                                  |

Dependabot applies `dependencies`, `github-actions`, `monorepo`, and `typescript`; bot PRs are excluded from notes by author.

### Sync labels to GitHub

Run once after creating the repo (and again when label names in [sync-labels.yml](../.github/workflows/sync-labels.yml) change):

**Actions → Sync GitHub labels → Run workflow**

Or from a machine with the [GitHub CLI](https://cli.github.com/) authenticated:

```bash
gh workflow run sync-labels.yml -R owner/repo
```

Safe to re-run (`gh label create --force` updates color/description). Keep labels aligned with [.github/release.yml](../.github/release.yml) and CI opt-in labels (`e2e`, `preview`).
