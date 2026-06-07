# Getting started

Starter for a product web app (React + Vite), marketing site (Astro), and Convex + Clerk backend. Shipping and CI are in [ci-cd.md](./ci-cd.md).

The template includes a small signed-in CRUD todo list (`/tasks`) to prove Clerk, Convex, and the web app work together. Use it as your setup check; replace it with your own product when you are ready.

[Prerequisites](./development.md#prerequisites): Git, Bun, Node.

## Local development

### 1. Create the repository

Use [**this template**](https://github.com/PeterHewat/Reactor/generate) on GitHub (not **Fork**), clone your repo, then:

```bash
bun install
bun run setup
```

### 2. Setup wizard (`bun run setup`)

Safe to **re-run anytime**. Each run re-asks questions with your previous answers as defaults (press **Enter** to keep).

| Step           | What it does                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**   | Product name + apex domain (e.g. `example.com`) → [`.reactor/setup.json`](../.reactor/setup.json), [packages/config/product.ts](../packages/config/product.ts) |
| **Clerk**      | [Create app](https://dashboard.clerk.com/apps) → Development keys → E2E user `e2e.test@{apex}` (API) → [allowed origins](./environments.md#clerk)              |
| **Convex**     | If not linked: run `bun run dev:convex`; then `npx convex env set CLERK_JWT_ISSUER_DOMAIN` and sync `VITE_CONVEX_URL`                                          |
| **Codegen**    | Routes + Convex `_generated/` + readiness report (**exit 0** = ready for PRs)                                                                                  |
| **GitHub**     | Optional: sync dev CI secrets via `gh` (default **yes** first time) — needs `gh auth login`                                                                    |
| **Vercel**     | Optional: two projects, web env vars, domains, **DNS hints**, optional `VERCEL_*` → `gh`                                                                       |
| **Production** | Optional: GitHub **`production`** environment for `prod-*` releases (live Clerk/Convex keys, prod deploy key)                                                  |

Dashboard URLs are printed as clickable links; the wizard asks **Open link? [y/N]** before opening your browser.

Details and fallbacks: [setup-automation.md](./setup-automation.md). **DNS and registrar records:** [environments.md](./environments.md#dns-at-your-registrar).

### 3. Run and verify the sample app

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks)
- Marketing: [localhost:4321](http://localhost:4321)

Day-to-day commands: [development.md](./development.md#commands).

### 4. Manual fallbacks

If you skip wizard steps:

| Service    | Action                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| **Clerk**  | [API keys](https://dashboard.clerk.com/last-active?path=api-keys) → `apps/web/.env.local` |
| **Convex** | `bun run dev:convex`; [dashboard](https://dashboard.convex.dev) for reference             |
| **GitHub** | [Repository secrets](./ci-cd.md#repository-secrets) or re-run setup                       |
| **Vercel** | [environments.md](./environments.md#vercel-web--marketing)                                |
| **DNS**    | [environments.md](./environments.md#dns-at-your-registrar)                                |

E2E variables are optional until [Playwright](./development.md#e2e-tests-playwright).

### 5. Before your first release

1. Green PR CI on `main` ([branch protection](./ci-cd.md#branch-protection)).
2. Dev stack working on `dev.example.com` / `dev.www.example.com` after DNS ([environments.md](./environments.md#dns-at-your-registrar)).
3. Answer **yes** on the setup **Production** step (or add secrets manually) before `prod-*` tags — [ci-cd.md](./ci-cd.md#production-environment-secrets).

---

## Next

- [Platform setup (domains, DNS, Clerk origins)](./environments.md)
- [Releases](./ci-cd.md#manual-workflows)
- [Replace the tasks demo](./spec/README.md) with your own specs
