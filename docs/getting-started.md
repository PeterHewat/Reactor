# Getting started

Fresh clone → local `/tasks` → production checklist (Part 2).

Prerequisites: Git, Bun (see `.bun-version`), Node 24 (see `.node-version`).

## What you will set up

| Order | Service                                               | Purpose                                                                                                                  |
| ----- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1     | **[GitHub](https://github.com/)**                     | Your repository ([**Use this template**](https://github.com/PeterHewat/Reactor/generate) — not fork — for clean history) |
| 2     | **[Clerk](https://dashboard.clerk.com)**              | Sign-in; **Issuer** URL for Convex                                                                                       |
| 3     | **[Convex](https://dashboard.convex.dev)**            | Backend deployment                                                                                                       |
| 4     | **[Vercel](https://vercel.com)** / **GitHub Actions** | Hosting and CI ([ci-cd.md](./ci-cd.md)) — §7 below                                                                       |

---

## Part 1 — Local development

### 1. Clone, install, setup

1. Create your repo with [**Use this template**](https://github.com/PeterHewat/Reactor/generate), then clone it.
2. From the repo root:

```bash
bun install
bun scripts/setup.ts
```

**What `setup` does:**

- Copies `apps/web/.env.local` and `apps/marketing/.env.local` from examples when missing
- Reads **`git remote origin`** and sets:
  - `VITE_REPO_URL` / `PUBLIC_REPO_URL`
  - `PRODUCT_NAME` in [packages/config/product.ts](../packages/config/product.ts) from the repo name (e.g. `foobar` → **Foobar**)
  - [README.md](../README.md) CI badge URLs and title when you are not on the upstream `PeterHewat/Reactor` template
- Runs route codegen and `doctor --bootstrap` (Convex link not required yet)

### 2. Clerk

[Create an application](https://dashboard.clerk.com) (or use an existing one). You need two values from Clerk; they go in **different places**:

| From Clerk                                  | Menu path                                                                                            | Goes in                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Publishable key** (`pk_test_…`)           | **Configure → API keys** → Quick copy → framework **React** (not React Router)                       | `apps/web/.env.local` → `VITE_CLERK_PUBLISHABLE_KEY`                                           |
| **Issuer** (`https://….clerk.accounts.dev`) | **Configure → Sessions → JWT templates** → **Add template** → **Convex** preset (keep name `convex`) | Convex dashboard only — [§3a](#3a-clerk-issuer-on-the-deployment) as `CLERK_JWT_ISSUER_DOMAIN` |

Steps:

1. Open `apps/web/.env.local` (created by `setup` from `.env.example`). Set `VITE_CLERK_PUBLISHABLE_KEY` from API keys.
2. Create the **Convex** JWT template and copy **Issuer**. Keep it handy for §3 — do **not** put Issuer in `apps/web/.env.local`.
3. `CLERK_SECRET_KEY` is only for Playwright E2E — skip for now.

**Google shows “Clerk”:** dev instances use Clerk’s shared Google OAuth app. For your product name on the Google screen, enable **Use custom credentials** on the Google SSO connection and set the app name in [Google Cloud OAuth branding](https://console.cloud.google.com/apis/credentials/consent). Clerk **Customize → Application name** only affects Clerk’s own UI.

Marketing site: `setup` already sets `PUBLIC_REPO_URL` in `apps/marketing/.env.local` when `git remote` is set.

### 3. Convex

#### 3a. Clerk issuer on the deployment

Convex dashboard → your dev deployment → **Settings** → **Environment variables** → add:

- **Name:** `CLERK_JWT_ISSUER_DOMAIN`
- **Value:** the **Issuer** URL from Clerk (§2 JWT template, Convex preset)

Convex validates JWTs from Clerk using this URL. The web app never reads this variable.

#### 3b. Link locally

```bash
bun run dev:convex
```

Writes root `.env.local`, syncs functions, generates `convex/_generated/api.*` (not only `convex/_generated/ai/` from setup).

#### 3c. Web Convex URL

In `apps/web/.env.local`:

```bash
VITE_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
```

Use the URL from the Convex dashboard or the `dev:convex` banner.

### 4. Run and verify `/tasks`

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks)
- Marketing: [localhost:4321](http://localhost:4321)

`bun scripts/doctor.ts -- --strict` when env is complete.

### 5. Quality checks

Before Convex: `bun run format:fix && bun run lint && bun run test:packages`

After Convex: `bun run format:fix && bun run lint && bun run typecheck && bun run test` (full list: [development.md § Commands](./development.md#commands))

---

## Part 2 — After `/tasks` works

Complete Part 1 first. `setup` already sets repo URLs and `PRODUCT_NAME` from `git remote`.

### 7. Verify identity (usually done by setup)

- [ ] `packages/config/product.ts` — `PRODUCT_NAME`, `PRODUCT_TAGLINE`
- [ ] `README.md` — title, description, CI badge URLs
- [ ] [SECURITY.md](../SECURITY.md) — private advisories go to **your** repo
- [ ] Root `package.json` — `name`, `author` (setup may set `name` to `<repo>-monorepo`)

Manual only if `setup` could not read `git remote origin`.

### 8. Package scope (optional)

Rename `@repo/*` → `@yourorg/*`: workspace `package.json` names, `tsconfig.paths.json`, `packages/config/aliases.ts`, imports, CI `--filter` names. Search `@repo/` before bulk replace.

### 9. Convex + Clerk (production)

- [ ] `CONVEX_DEPLOY_KEY` in GitHub Actions
- [ ] `CLERK_JWT_ISSUER_DOMAIN` on **production** Convex deployment
- [ ] [apps/web/vercel.json](../apps/web/vercel.json) CSP for your Clerk host ([security-headers.md](./security-headers.md))

### 10. GitHub Actions

- [ ] Secrets in [ci-cd.md#github-actions-secrets](./ci-cd.md#github-actions-secrets)
- [ ] `CI_STRICT=1` after `CONVEX_DEPLOY_KEY` is set ([ci-cd.md](./ci-cd.md#optional-ci-guardrails))
- [ ] Branch protection — [ci-cd.md#branch-protection](./ci-cd.md#branch-protection)
- [ ] PR labels: [sync-labels workflow](../.github/workflows/sync-labels.yml) or `bash scripts/sync-github-labels.sh`

### 11. Vercel

- [ ] Two projects: `apps/web`, `apps/marketing` ([ci-cd.md](./ci-cd.md))
- [ ] `bun scripts/sync-vercel-headers.ts` after editing [packages/config/vercel-base-headers.json](../packages/config/vercel-base-headers.json)

### 12. Remove the sample tasks slice

- [ ] Web: delete `apps/web/src/features/tasks/`, `apps/web/src/routes/tasks.tsx`; update nav in `apps/web/src/components/app-header.tsx`
- [ ] Convex: delete `convex/tasks.ts`, `convex/model/tasks.ts`, related tests; update `convex/schema.ts`
- [ ] Tests: remove `apps/web/tests/tasks.smoke.e2e.ts`, `tests/pom/TasksPage.ts`, `playwright.smoke.config.ts` if smoke was tasks-only
- [ ] Docs: replace [docs/spec/v0/](./spec/v0/) with your feature spec

### 13. Product docs

- [ ] [docs/product.md](./product.md), [docs/architecture.md](./architecture.md)
- [ ] First feature spec in [docs/spec/](./spec/README.md)

```bash
bun scripts/doctor.ts -- --strict
# Ship backend: Release workflow — docs/ci-cd.md
```
