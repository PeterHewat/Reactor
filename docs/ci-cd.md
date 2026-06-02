# CI/CD and deployments

Ongoing reference for GitHub Actions, secrets, and deploy workflows. **Onboarding:** [README](../README.md) → [getting-started.md](./getting-started.md) (§2–6). **Commands:** [package.json](../package.json) or [getting-started.md#commands](./getting-started.md#commands). **Day-2 patterns:** [development.md](./development.md).

## Workflows

| Workflow                                                | Required? | Purpose                                                           |
| ------------------------------------------------------- | --------- | ----------------------------------------------------------------- |
| [ci.yml](../.github/workflows/ci.yml)                   | Yes       | Lint, test, and build on every PR/push to `main`                  |
| [release.yml](../.github/workflows/release.yml)         | Yes       | Create GitHub release + deploy **new** tags                       |
| [deploy.yml](../.github/workflows/deploy.yml)           | Yes       | Deploy or **rollback** to an existing tag (e.g. `web-v1.0.0`)     |
| [preview.yml](../.github/workflows/preview.yml)         | Optional  | PR previews when the `preview` label is added                     |
| [sync-labels.yml](../.github/workflows/sync-labels.yml) | Optional  | Manual: sync issue/PR labels from `scripts/sync-github-labels.sh` |

**New release:** Actions → **Release** → Run workflow (scope + version bump). Release notes are auto-generated from merged PRs using [.github/release.yml](../.github/release.yml) (label categories, exclusions).

**Rollback / redeploy:** Actions → **Deploy** → Run workflow → tag `web-v1.0.0` (checks out that git tag, rebuilds, deploys to production).

**CI vs deploy:** [ci.yml](../.github/workflows/ci.yml) runs lint, format, typecheck, and tests on PRs and `main`. [deploy.yml](../.github/workflows/deploy.yml) only builds and ships. The [Release](../.github/workflows/release.yml) workflow requires a successful `ci.yml` run for the **release commit** (`github.sha`) before creating tags; still run Release only when you intend to ship.

**Web deploy codegen:** Production and preview web deploys run `bun run generate:routes` and `bun run generate:convex` before `vercel build` (`convex/_generated/` is not committed). Requires `CONVEX_DEPLOY_KEY` (production) or `CONVEX_PREVIEW_DEPLOY_KEY` (previews).

**Full E2E on `main`:** When `apps/web/**` changes, [ci.yml](../.github/workflows/ci.yml) runs the full Playwright suite on pushes to `main`; failures fail **CI required** (smoke runs on every web PR; full suite is label-opt-in on PRs via `e2e`).

**No Turborepo/Nx:** CI uses path-based jobs and the [setup-bun](../.github/actions/setup-bun/action.yml) composite action (cached install). See [ADR-003](./adr/003-bun-native-monorepo-tasks-and-ci.md).

**Docs-only PRs:** When only `docs/**` or repo meta files change (`README.md`, `AGENTS.md`, etc.), the **Format** job still runs; lint/typecheck/build are skipped.

**Convex codegen in CI:** Jobs that need `convex/_generated/` (`typecheck`, `build-web`, `@repo/web` tests, `tests-convex`) run `bun run generate:convex` when `CONVEX_DEPLOY_KEY` is configured. Otherwise they emit a `::notice::` and skip (exit 0) — no committed generated files. Once the deploy key is present, those jobs run on every matching PR; you do **not** need extra variables for that.

### Optional CI guardrails

Repository variables (**Settings → Secrets and variables → Actions → Variables**) change behavior only when secrets are **missing** or removed:

| Variable                    | When set to `1`                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `CI_STRICT`                 | Fail typecheck, build-web, `@repo/web` tests, and Convex tests if `CONVEX_DEPLOY_KEY` is not configured (default: skip with notice, exit 0). |
| `E2E_SMOKE_REQUIRE_SECRETS` | Fail `web-e2e-smoke` if smoke secrets are missing (default: skip Playwright, job still passes).                                              |

**Recommended after adoption:** set `CI_STRICT=1` once `CONVEX_DEPLOY_KEY` is configured ([customize-after-fork.md](./customize-after-fork.md#4-github-actions)). Without it, deleting or misconfiguring the deploy key can leave **CI required** green while Convex jobs skip.

Use `CI_STRICT` before secrets exist if you want fail-closed CI during onboarding. `E2E_SMOKE_REQUIRE_SECRETS` is optional. Neither changes behavior while all required secrets are present.

### Fork PRs and CI

Pull requests from **forks** do not receive your repository’s Actions secrets. For those PRs, jobs that depend on `CONVEX_DEPLOY_KEY` or smoke secrets will **skip** (with a notice) while `ci-required` can still pass if lint/format and other non-secret jobs succeed.

Implications for public/open-source repos:

- External contributors may see a green **CI required** without Convex typecheck, web build, or authenticated smoke running on their branch.
- **Mitigations:** require maintainer review; run CI on internal branches only; use a bot that tests trusted forks (evaluate `pull_request_target` security tradeoffs carefully); or treat fork PRs as draft until a maintainer pushes to a branch in your org.

Private team repos that only accept PRs from the same org are unaffected (secrets are available).

## Branch protection

After configuring secrets, protect `main` in **Settings → Branches**. Suggested required checks:

| Check          | Job                                        |
| -------------- | ------------------------------------------ |
| CI required    | `ci-required` (aggregates path-based jobs) |
| Security audit | `security-audit`                           |
| Secrets scan   | `secrets-scan`                             |

> **Note:** Individual jobs (`Typecheck`, `Build Web`, …) can show **Success (skipped)** when paths or secrets do not apply. Rely on **CI required** as the merge gate — it fails when an expected job for changed paths did not succeed.

## CI and test jobs

| Job               | Workflow                              | When it runs                | Behavior                                                                           |
| ----------------- | ------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| `ci-required`     | [ci.yml](../.github/workflows/ci.yml) | Every PR/push               | Fails when expected jobs for changed paths did not succeed                         |
| `build-web`       | [ci.yml](../.github/workflows/ci.yml) | `apps/web/**` changed       | Production Vite build (placeholder env vars)                                       |
| `build-marketing` | [ci.yml](../.github/workflows/ci.yml) | `apps/marketing/**` changed | Astro production build                                                             |
| `tests-web`       | [ci.yml](../.github/workflows/ci.yml) | `apps/web/**` or shared     | `@repo/web` (when Convex linked), `@repo/ui-web`, `@repo/utils` unit + integration |
| `tests-packages`  | [ci.yml](../.github/workflows/ci.yml) | Shared packages / config    | `@repo/config`, `@repo/env-core` unit tests                                        |
| `tests-convex`    | [ci.yml](../.github/workflows/ci.yml) | `convex/**` changed         | When `CONVEX_CI_TESTS: true` (Vitest + `convex-test`)                              |
| `web-e2e-smoke`   | [ci.yml](../.github/workflows/ci.yml) | `apps/web/**` changed       | Playwright `/tasks` smoke when secrets configured                                  |

**Tests on every PR:** `tests-web`, `tests-marketing`, `tests-packages` (after the matching build/lint jobs). **`web-e2e-smoke`** runs when web paths change; it **skips** Playwright install/run until E2E secrets exist (job still passes unless `E2E_SMOKE_REQUIRE_SECRETS=1` — see [Optional CI guardrails](#optional-ci-guardrails)).

**Opt-in on PRs (labels):**

| Label     | Workflow                                        | When                                                 |
| --------- | ----------------------------------------------- | ---------------------------------------------------- |
| `e2e`     | [ci.yml](../.github/workflows/ci.yml)           | Playwright for web/marketing when those paths change |
| `preview` | [preview.yml](../.github/workflows/preview.yml) | Convex preview + Vercel preview deploys (see below)  |

Root lint, format, and typecheck run when any app package changes.

### E2E tests (Playwright)

- **Smoke (tasks + Clerk + Convex):** `bun run e2e:smoke` — runs on every PR when `apps/web/**` changes (`web-e2e-smoke`). Configure `CLERK_SECRET_KEY`, `E2E_CLERK_USER_EMAIL`, `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` in GitHub Actions; see [development.md](./development.md#e2e-smoke-tasks).
- **Full suite:** `bun run e2e:install` once, then `bun run --filter @repo/web e2e` (or `@repo/marketing`)
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

See [security-headers.md](./security-headers.md) to tune CSP in `apps/web/vercel.json` for your Clerk domain.

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

## Alternative: Vercel Git deploys only

This template defaults to **GitHub Actions** for production deploys (`release.yml` / `deploy.yml`) with `git.deploymentEnabled: false` in each `vercel.json`.

To use **Vercel’s Git integration** instead:

1. Enable automatic Git deployments in each Vercel project (or remove `git.deploymentEnabled: false` from `apps/web/vercel.json` and `apps/marketing/vercel.json`).
2. Rely on Vercel preview/production builds; keep [ci.yml](../.github/workflows/ci.yml) for lint, test, and typecheck.
3. For **web**, set `CONVEX_DEPLOY_KEY` in Vercel project env (Production + Preview) so `apps/web/vercel.json` `buildCommand` can run `generate:convex` before the Vite build. Set `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` as usual.
4. Skip or disable [release.yml](../.github/workflows/release.yml) / [deploy.yml](../.github/workflows/deploy.yml) if you do not need tag-based releases from Actions.

Trade-off: tag-based rollbacks and monorepo prebuilt deploys from Actions are documented in this repo; Vercel-only is simpler but uses Vercel’s build pipeline per project.

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

Install the [GitHub CLI](https://cli.github.com/) and authenticate (`gh auth login`), then from the repo root:

```bash
brew install gh   # once, if missing
gh auth login     # once per machine
bash scripts/sync-github-labels.sh
```

Implementation: [scripts/sync-github-labels.sh](../scripts/sync-github-labels.sh). Safe to re-run (`gh label create --force` updates color/description).

Or run the **[Sync GitHub labels](../.github/workflows/sync-labels.yml)** workflow (Actions → Sync GitHub labels → Run workflow).
