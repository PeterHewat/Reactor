# Getting started

End-to-end setup after you create your repository (§1): toolchain → Convex → Clerk → working `/tasks` → Vercel + CI deploys.

**Prerequisites (local):** [development.md](./development.md#prerequisites) — Bun, Node, Git.

## What you will set up

| Order | Service                                                   | Purpose                                                                    |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1     | **[GitHub](https://github.com/)**                         | Your repository (use **Use this template**, not fork, for a clean history) |
| 2     | **[Convex](https://dashboard.convex.dev)**                | Backend deployment; production deploy key for releases                     |
| 3     | **[Clerk](https://dashboard.clerk.com)**                  | Sign-in for web; JWT issuer wired into Convex                              |
| 4     | **[Vercel](https://vercel.com)**                          | Host `apps/web` and `apps/marketing`; env vars for production builds       |
| 5     | **[GitHub Actions](https://github.com/features/actions)** | Secrets so CI can build, test, and deploy ([ci-cd.md](./ci-cd.md))         |

The sample **tasks** slice is the proof everything is wired: auth, Convex mutations, and the web UI.

## 1. Create your repo and toolchain

1. On GitHub, click [**Use this template**](https://github.com/PeterHewat/Reactor/generate) and create your repository.
2. Clone **your** repo and install:

```bash
git clone git@github.com:YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO                                     # project root
bun install                                      # workspace deps + Husky hooks
bun run generate                                 # convex/_generated, route tree, agent skills
bun run doctor                                   # toolchain + env checklist
```

`bun run generate` creates gitignored artifacts (`convex/_generated/`, `routeTree.gen.ts`, `.agents/skills/`) and runs automatically before `typecheck` / `test`.

## 2. Convex

From the repo root:

```bash
bun run dev:convex
```

This logs you into Convex, creates or links a project, writes root `.env.local` (`CONVEX_DEPLOYMENT`), and keeps codegen in sync.

Copy the web env template and set the deployment URL:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Set in `apps/web/.env.local`:

- `VITE_CONVEX_URL` (Convex dashboard → Settings → URL, or from root `.env.local`)
- `VITE_REPO_URL` — `https://github.com/YOUR_ORG/YOUR_REPO` (powers web UI links to your repo/docs)

Details: [convex/README.md](../convex/README.md).

## 3. Clerk

1. Create an application in the [Clerk dashboard](https://dashboard.clerk.com).
2. Set `VITE_CLERK_PUBLISHABLE_KEY` in `apps/web/.env.local`.
3. Copy `convex/auth.config.ts.example` → `convex/auth.config.ts`.
4. In the Convex dashboard, set `CLERK_JWT_ISSUER_DOMAIN` (see [convex/README.md](../convex/README.md#clerk-authentication)).

For marketing site CTAs, copy [apps/marketing/.env.example](../apps/marketing/.env.example) to `apps/marketing/.env` and set `PUBLIC_REPO_URL` to the same GitHub URL (optional for local marketing dev).

## 4. Run the stack and verify `/tasks`

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks) — sign in, create and complete tasks
- Marketing: [localhost:4321](http://localhost:4321) (static site; no Clerk/Convex required)

`bun run doctor` should show web env, root `.env.local`, and `convex/auth.config.ts` when configured.

## 5. Quality checks

```bash
bun run format:fix && bun run lint && bun run typecheck && bun run test
```

**CI on a new template repo:** GitHub Actions runs on push before secrets exist — builds may fail until §6 is done. That is expected; first green `main` usually comes after Actions secrets and Vercel projects are configured.

## 6. Vercel and production deploys

### Deploy checklist

- [ ] **Vercel — web** — project root `apps/web`; env `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] **Vercel — marketing** — project root `apps/marketing`
- [ ] **GitHub Actions secrets** — see table in [ci-cd.md#github-actions-secrets](./ci-cd.md#github-actions-secrets)
- [ ] **Convex production** — `CONVEX_DEPLOY_KEY` in GitHub; deploy via Release workflow scope `convex` → tag `convex-v*`
- [ ] **PR labels** (optional) — run `bash scripts/sync-github-labels.sh` so release notes match [ci-cd.md](./ci-cd.md#pr-labels-and-release-notes)
- [ ] **First release** — Actions → **Release** → scope `web` / `marketing` / `convex` / `all` → tags `web-v*`, `marketing-v*`, `convex-v*`

### Vercel projects

Create **two** Vercel projects from your GitHub repo:

| Vercel project | Root directory   | Env vars (Production + Preview)                 |
| -------------- | ---------------- | ----------------------------------------------- |
| Web            | `apps/web`       | `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` |
| Marketing      | `apps/marketing` | (static; optional analytics only)               |

Each app includes `vercel.json` with monorepo install/build commands. Disable automatic Git deploys on Vercel if you ship via GitHub Actions only (`git.deploymentEnabled: false` in each `vercel.json` — see [ci-cd.md](./ci-cd.md)).

### GitHub Actions secrets

In your repo: **Settings → Secrets and variables → Actions**, add the secrets listed in [ci-cd.md#github-actions-secrets](./ci-cd.md#github-actions-secrets) (`CONVEX_DEPLOY_KEY`, `VITE_*`, `VERCEL_*`, optional `CONVEX_PREVIEW_DEPLOY_KEY`).

### Convex production deploy

Link production in the Convex dashboard, generate a **deploy key**, store it as `CONVEX_DEPLOY_KEY` in GitHub Actions. Ship backend changes with the Release workflow and scope **convex** (creates `convex-v*` and runs `convex deploy` in CI). Details: [ci-cd.md](./ci-cd.md).

### First release

When `main` is green in CI, run the **Release** workflow (Actions → Release) with the scope you changed (`web`, `marketing`, `convex`, or `all`). That creates tags and deploys via [release.yml](../.github/workflows/release.yml).

Full workflow reference: [ci-cd.md](./ci-cd.md).

## Commands

Root scripts from [package.json](../package.json). Setup steps above use the **dev** and **quality** groups.

### Dev servers

```bash
bun run dev                              # Web + marketing
bun run dev:web                          # Web only (:5173)
bun run dev:marketing                    # Marketing only (:4321)
bun run dev:convex                       # Convex (codegen + deployment sync)
bun run dev:full                         # Web + marketing + Convex
bun run doctor                           # Toolchain + env checklist
```

Per-workspace (equivalent filters):

```bash
bun run --filter @repo/web dev
bun run --filter @repo/marketing dev
```

### Codegen

```bash
bun run generate                         # Routes + Convex + agent skills (also pretypecheck / pretest)
bun run generate:routes                  # TanStack Router route tree only
bun run generate:convex                  # convex/_generated only
bun run generate:ai                      # .agents/skills + CLAUDE convex block
```

### Quality checks

```bash
bun run format:fix && bun run lint && bun run typecheck && bun run test
bun run lint
bun run format                           # Prettier check only
bun run format:fix                       # Prettier write
bun run typecheck
bun run typecheck:refs                   # TS project references only
```

### Build

```bash
bun run build                            # TS project references / package .d.ts
bun run build:all                        # build + all workspace build scripts
bun run clean
bun run --filter @repo/web build         # Vite production bundle
bun run --filter @repo/marketing build   # Astro production build
```

### Test

```bash
bun run test                             # All workspace unit tests
bun run e2e:install                      # Playwright browsers (one-time)
bun run --filter @repo/web e2e
bun run --filter @repo/marketing e2e
```

### Dependencies

```bash
bun install
bun run clean-install
bun run outdated
bun run update
```

More detail (E2E with Convex, Tailwind, Convex unit tests): [development.md](./development.md).

Doc map: [README](../README.md#resources).
