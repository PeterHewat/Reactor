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

`setup` copies [apps/web/.env.example](../apps/web/.env.example) to [apps/web/.env.local](../apps/web/.env.local), sets `PRODUCT_NAME` from `git remote` when possible, updates README off the upstream template, and runs route codegen + `doctor`.

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

### 4. Run and verify the sample app

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks)
- Marketing: [localhost:4321](http://localhost:4321)

Day-to-day commands: [development.md](./development.md#commands).

### 5. GitHub Actions secrets

Before opening pull requests that touch the web app or Convex backend, add at least **`CONVEX_DEPLOY_KEY`** in GitHub (**Settings → Secrets and variables → Actions**). See [GitHub Actions secrets](./ci-cd.md#github-actions-secrets) for the full list (Clerk, Vercel, E2E, and so on).

---

## Next

When the sample app works locally and CI secrets are configured:

- [Branch protection](./ci-cd.md#branch-protection)
- [Vercel (web + marketing)](./ci-cd.md#vercel-web--marketing)
- [Releases](./ci-cd.md#workflows)
- [Replace the tasks demo](./spec/README.md) with your own specs
