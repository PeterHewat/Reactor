# CI/CD and deployments

Ongoing reference for GitHub Actions, secrets, and deploy workflows. **Onboarding:** [README](../README.md) → [getting-started.md](./getting-started.md) (§2–6). **Commands:** [package.json](../package.json) or [getting-started.md#commands](./getting-started.md#commands). **Day-2 patterns:** [development.md](./development.md).

## Workflows

| Workflow                                        | Required? | Purpose                                                       |
| ----------------------------------------------- | --------- | ------------------------------------------------------------- |
| [ci.yml](../.github/workflows/ci.yml)           | Yes       | Lint, test, and build on every PR/push to `main`              |
| [release.yml](../.github/workflows/release.yml) | Yes       | Create GitHub release + deploy **new** tags                   |
| [deploy.yml](../.github/workflows/deploy.yml)   | Yes       | Deploy or **rollback** to an existing tag (e.g. `web-v1.0.0`) |
| [preview.yml](../.github/workflows/preview.yml) | Optional  | PR previews when the `preview` label is added                 |

**New release:** Actions → **Release** → Run workflow (scope + version bump). Release notes are auto-generated from merged PRs using [.github/release.yml](../.github/release.yml) (label categories, exclusions).

**Rollback / redeploy:** Actions → **Deploy** → Run workflow → tag `web-v1.0.0` (checks out that git tag, rebuilds, deploys to production).

**CI vs deploy:** [ci.yml](../.github/workflows/ci.yml) runs lint, format, typecheck, and tests on PRs and `main`. [deploy.yml](../.github/workflows/deploy.yml) only builds and ships — assume `main` is already green before releasing.

## CI and test jobs

| Job               | Workflow                              | When it runs                | Behavior                                              |
| ----------------- | ------------------------------------- | --------------------------- | ----------------------------------------------------- |
| `build-web`       | [ci.yml](../.github/workflows/ci.yml) | `apps/web/**` changed       | Production Vite build (placeholder env vars)          |
| `build-marketing` | [ci.yml](../.github/workflows/ci.yml) | `apps/marketing/**` changed | Astro production build                                |
| `tests-convex`    | [ci.yml](../.github/workflows/ci.yml) | `convex/**` changed         | When `CONVEX_CI_TESTS: true` (Vitest + `convex-test`) |

**Tests on every PR:** `tests-web`, `tests-marketing`, shared package tests (after the matching build job passes).

**Opt-in on PRs (labels):**

| Label     | Workflow                                        | When                                                 |
| --------- | ----------------------------------------------- | ---------------------------------------------------- |
| `e2e`     | [ci.yml](../.github/workflows/ci.yml)           | Playwright for web/marketing when those paths change |
| `preview` | [preview.yml](../.github/workflows/preview.yml) | Convex preview + Vercel preview deploys (see below)  |

Root lint, format, and typecheck run when any app package changes.

### E2E tests (Playwright)

- **Local:** `bun run e2e:install` once, then `bun run --filter @repo/web e2e` (or `@repo/marketing`)
- **CI:** Add the **`e2e`** label on a PR; runs when web or marketing paths change (after the matching build job)
- **Naming:** `*.e2e.ts` files
- **Convex in E2E:** Prefer a real dev deployment (`VITE_CONVEX_URL`); see [development.md](./development.md#e2e-tests-playwright)

## GitHub Actions secrets

Configure these in the repository: **Settings → Secrets and variables → Actions**.

### Required secrets (adopter projects)

| Secret                       | Description                                        | Where to find it                                                                                                    |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOY_KEY`          | Convex **production** deploy key (releases)        | Convex Dashboard → Settings → Deploy Key                                                                            |
| `CONVEX_PREVIEW_DEPLOY_KEY`  | Convex **preview** deploy key (PR `preview` label) | Convex Dashboard → Settings → [Preview deploy keys](https://docs.convex.dev/production/hosting/preview-deployments) |
| `VITE_CONVEX_URL`            | Convex deployment URL                              | Convex Dashboard → Settings → URL                                                                                   |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                              | Clerk Dashboard → API Keys                                                                                          |

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
