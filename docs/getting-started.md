# Getting started

Starter for a product web app (React + Vite), marketing site (Astro), and Convex + Clerk backend. Shipping and CI are in [ci-cd.md](./ci-cd.md).

The template includes a small signed-in CRUD todo list (`/tasks`) to prove Clerk, Convex, and the web app work together. Use it as your setup check; replace it with your own product when you are ready.

[Prerequisites](./development.md#prerequisites): Git, Bun, Node.

## Local development

### 1. Create the repository

Use [**this template**](https://github.com/PeterHewat/Reactor/generate) on GitHub (not **Fork**), clone your repo, then:

```bash
bun install
bun scripts/setup.ts
```

`setup` is safe to **re-run anytime**. It copies [apps/web/.env.example](../apps/web/.env.example) to [apps/web/.env.local](../apps/web/.env.local) when missing, sets `PRODUCT_NAME` from `git remote` when possible, updates README off the upstream template, runs codegen, optionally installs Convex agent skills, then prints a readiness report. **Exit 0** means blocking checks passed; **exit 1** lists what to fix next ([getting-started](./getting-started.md) steps below).

### 2. Clerk and the web app

1. [Create a Clerk application](https://dashboard.clerk.com).
2. Open [apps/web/.env.local](../apps/web/.env.local) and replace each placeholder using the comments for guidance. E2E variables are optional until [Playwright](./development.md#e2e-tests-playwright).

### 3. Convex

1. In the [Convex dashboard](https://dashboard.convex.dev), open your **Development** deployment → **Settings** → **Environment variables** and add **`CLERK_JWT_ISSUER_DOMAIN`**. In Clerk: **Sessions** → **JWT templates** → **Convex** preset → copy the **Issuer** URL (e.g. `https://your-app.clerk.accounts.dev`).
2. Link the project and start the dev backend:

```bash
bun run dev:convex
```

Follow the CLI prompts on first run. Set `VITE_CONVEX_URL` in [apps/web/.env.local](../apps/web/.env.local) to your deployment URL (shown in the terminal or the Convex dashboard) if it is still a placeholder.

Re-run `bun scripts/setup.ts` to refresh Convex codegen and see which checks still need attention.

### 4. Run and verify the sample app

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks)
- Marketing: [localhost:4321](http://localhost:4321)

Day-to-day commands: [development.md](./development.md#commands).

Re-run `bun scripts/setup.ts` when `/tasks` works — it should exit 0 before you open pull requests.

### 5. GitHub Actions secrets

Before opening pull requests that touch the web app or Convex backend:

1. Add **`CONVEX_DEPLOY_KEY`** (dev or preview key for CI codegen) under **Settings → Secrets and variables → Actions**.
2. Create the **`production`** environment and add prod deploy secrets before your first `prod-*` release — [environments.md](./environments.md#github-environments).

Repository vs production scope: [ci-cd.md](./ci-cd.md#repository-secrets).

---

## Next

When the sample app works locally and CI secrets are configured:

- [Platform setup (Convex, Clerk, Vercel, domains)](./environments.md)
- [Branch protection](./ci-cd.md#branch-protection)
- [GitHub `production` environment](./ci-cd.md#github-environments)
- [Releases](./ci-cd.md#workflows)
- [Replace the tasks demo](./spec/README.md) with your own specs
