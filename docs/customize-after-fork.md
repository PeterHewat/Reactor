# Customize after adopting the template

Checklist after [**Use this template**](https://github.com/PeterHewat/Reactor/generate) (create a new repo — do not fork if you want a clean history). Keeps env wiring and CI working while you rename the product.

## 1. Repository identity

- [ ] Replace `YOUR_ORG` / `YOUR_REPO` in docs and `.env.example` files (or run `bun run setup -- --repo https://github.com/ORG/REPO --yes`)
- [ ] Update [README.md](../README.md) title, description, and **CI badge URLs** (`PeterHewat/Reactor` → your org/repo)
- [ ] Update [SECURITY.md](../SECURITY.md) so private advisories go to **your** repository (not the upstream template)
- [ ] Set `VITE_REPO_URL` and `PUBLIC_REPO_URL` (setup does this when `--repo` is passed)

### Product branding

- [ ] [packages/config/product.ts](../packages/config/product.ts): `PRODUCT_NAME`, `PRODUCT_TAGLINE` (web locales and marketing import these)
- [ ] Root [package.json](../package.json): `name`, `author`
- [ ] Marketing: [apps/marketing/astro.config.mjs](../apps/marketing/astro.config.mjs) (`site` URL), [apps/marketing/src/pages/index.astro](../apps/marketing/src/pages/index.astro), [apps/marketing/src/layouts/Layout.astro](../apps/marketing/src/layouts/Layout.astro), sample [apps/marketing/src/content/blog/hello-world.md](../apps/marketing/src/content/blog/hello-world.md)
- [ ] [LICENSE](../LICENSE) (copyright)
- [ ] E2E: [apps/marketing/tests/home.e2e.ts](../apps/marketing/tests/home.e2e.ts) (uses `SITE_NAME` from [site.ts](../apps/marketing/src/lib/site.ts)); web E2E use [packages/config/product.ts](../packages/config/product.ts) via test helpers

## 2. Package scope (optional)

Default workspace scope is `@repo/*`. To rename:

- [ ] Root and workspace `package.json` `name` fields (`@repo/web` → `@acme/web`, etc.)
- [ ] `tsconfig.paths.json` path keys
- [ ] `packages/config/aliases.ts` alias keys
- [ ] Import paths across apps and packages (`@repo/` → `@acme/`)
- [ ] Root [package.json](../package.json) `test` / filter scripts and [.github/workflows/ci.yml](../.github/workflows/ci.yml) `--filter` names
- [ ] [scripts/generate-routes.ts](../scripts/generate-routes.ts) filter name

## 3. Convex + Clerk

- [ ] `bun run dev:convex` → root `.env.local`
- [ ] `apps/web/.env.local`: `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] Convex dashboard: `CLERK_JWT_ISSUER_DOMAIN` (`convex/auth.config.ts` is already committed)
- [ ] [apps/web/vercel.json](../apps/web/vercel.json) CSP: Clerk production host (see [security-headers.md](./security-headers.md))

## 4. GitHub Actions

- [ ] Secrets in [ci-cd.md#github-actions-secrets](./ci-cd.md#github-actions-secrets)
- [ ] Run [sync-labels workflow](../.github/workflows/sync-labels.yml) or `bash scripts/sync-github-labels.sh`
- [ ] Branch protection on `main`: require **CI required** plus **Security audit** and **Secrets scan** (see [ci-cd.md#branch-protection](./ci-cd.md#branch-protection))
- [ ] After `CONVEX_DEPLOY_KEY` is set: repository variable **`CI_STRICT=1`** ([Settings → Actions → Variables](./ci-cd.md#optional-ci-guardrails)) so CI fails if the deploy key is removed or misconfigured (default is skip-with-notice while **CI required** still passes)
- [ ] _(Optional)_ `E2E_SMOKE_REQUIRE_SECRETS=1` — fail smoke when E2E secrets are missing (default: skip Playwright, job passes)
- [ ] _(Public OSS)_ Read [fork PRs and CI](./ci-cd.md#fork-prs-and-ci) if you accept contributions from forks

## 5. Vercel

- [ ] Two projects: `apps/web`, `apps/marketing`
- [ ] `bun run sync:vercel-headers` after editing [packages/config/vercel-base-headers.json](../packages/config/vercel-base-headers.json)

## 6. Replace the sample tasks slice

Remove the demo vertical in this order (adjust if you already renamed packages):

### Web (`apps/web`)

- [ ] Delete `src/features/tasks/` and `src/routes/tasks.tsx`
- [ ] Remove tasks route from navigation ([`src/components/app-header.tsx`](../apps/web/src/components/app-header.tsx), home links)
- [ ] Update [docs/spec/feature-matrix.md](./spec/feature-matrix.md) row F-01 (remove or mark removed)

### Convex (`convex/`)

- [ ] Delete `tasks.ts`, `model/tasks.ts`, `model/tasks.test.ts`
- [ ] Remove `tasks` table from `schema.ts` (or replace with your domain)
- [ ] Run `bun run generate:convex` after schema changes

### Tests & CI

- [ ] Delete `apps/web/tests/tasks.smoke.e2e.ts`, `tests/pom/TasksPage.ts`, `playwright.smoke.config.ts` if smoke is tasks-only
- [ ] Remove GitHub secrets used only for tasks smoke (`E2E_CLERK_USER_EMAIL`, etc.) if you drop Clerk E2E
- [ ] Update [docs/spec/v0/tasks.md](./spec/v0/tasks.md) or archive the spec

### Docs

- [ ] Replace [docs/spec/v0/](./spec/v0/) with your first feature spec
- [ ] Point [docs/product.md](./product.md) and [docs/architecture.md](./architecture.md) at your product

## 7. Product docs

- [ ] [docs/product.md](./product.md), [docs/architecture.md](./architecture.md)
- [ ] First feature spec in [docs/spec/](./spec/README.md)

## Commands

```bash
bun run setup -- --repo https://github.com/YOUR_ORG/YOUR_REPO --yes
bun run doctor -- --bootstrap   # lenient first pass
bun run dev:convex
bun run generate:convex
bun run doctor -- --strict
```

After editing [AGENTS.md](../AGENTS.md): `bun run sync:agent-docs` (keeps [CLAUDE.md](../CLAUDE.md) aligned; Convex block unchanged).
