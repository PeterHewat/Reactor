# Getting started

Starter for a product web app (React + Vite), marketing site (Astro), and Convex + Clerk backend. Shipping and CI are in [ci-cd.md](./ci-cd.md).

The template includes a small signed-in CRUD todo list (`/tasks`) to prove Clerk, Convex, and the web app work together. Use it as your setup check; replace it with your own product when you are ready.

[Prerequisites](./development.md#prerequisites): Git, Bun, Node, `gh`, plus GitHub, Convex, Clerk, and Vercel accounts. An apex domain is optional at first — add one when you are ready for custom hostnames.

## Local development

### 1. Create the repository

Use [**this template**](https://github.com/PeterHewat/Reactor/generate) on GitHub (not **Fork**), clone your repo, then:

```bash
bun install && bun run setup
```

### 2. Setup wizard (`bun run setup`)

Safe to **re-run anytime** (resume after interruptions). Each run re-asks questions with your previous answers as defaults (press **Enter** to keep).

| Step           | What it does                                                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CLI check**  | `gh` (global) + `bunx convex` / `bunx vercel` / `bunx clerk` (devDependencies); runs login commands when needed — continue manually if tools are missing                                                    |
| **Identity**   | Product name + tagline + optional apex domain (Enter to skip) + optional MIT LICENSE removal → [`.reactor/setup.json`](../.reactor/setup.json), [packages/config/product.ts](../packages/config/product.ts) |
| **Clerk**      | [Clerk CLI](https://clerk.com/docs/cli): `apps create` / `link` + `env pull` when logged in; else dashboard keys. E2E user `e2e.test@{apex}` (API) → [allowed origins](./environments.md#clerk)             |
| **Convex**     | Runs `convex dev --once` (browser login if needed) → sets `CLERK_JWT_ISSUER_DOMAIN` → syncs `VITE_CONVEX_URL`. Daily dev: `bun run dev:convex`.                                                             |
| **Codegen**    | Routes + Convex `_generated/` + optional Convex/Clerk agent skills + readiness report (**exit 0** = ready for PRs)                                                                                          |
| **GitHub**     | Sync dev CI secrets via `gh` (default **yes** first time) — `gh auth login -s repo,workflow` (setup can prompt `gh auth refresh` if needed)                                                                 |
| **Vercel**     | Two projects, web env vars, custom domains when apex is set, **Vercel DNS nameserver pause**, `VERCEL_*` → `gh` (default **yes** first time)                                                                |
| **Production** | Defer until release: GitHub **`production`** environment for `release-*` (live Clerk/Convex keys, prod deploy key)                                                                                          |

Dashboard URLs are printed as clickable links in setup steps — open them directly in your terminal or browser.

Details and fallbacks: [setup-automation.md](./setup-automation.md). **DNS (Vercel nameservers at your registrar):** [environments.md](./environments.md#dns-vercel-dns-at-your-registrar).

### 3. Run and verify the sample app

```bash
bun run dev:full
```

- Web: [localhost:5173/tasks](http://localhost:5173/tasks)
- Marketing: [localhost:4321](http://localhost:4321)

Day-to-day commands: [development.md](./development.md#commands).

### 4. If setup fails

Resume `bun run setup`, or see [setup-automation.md](./setup-automation.md) for manual steps and dashboard URLs.

### 5. Before your first release

1. Green PR CI on `main` ([branch protection](./ci-cd.md#branch-protection)).
2. Merge to `main` — **Staging** deploys Convex dev + E2E; Vercel Git updates `preview.*` ([environments.md](./environments.md)).
3. Answer **yes** on the setup **Production** step (or add secrets manually) before running **Release** — [ci-cd.md](./ci-cd.md#production-environment-secrets).

---

## Next

- [Platform setup (domains, DNS, Clerk origins)](./environments.md)
- [Releases](./ci-cd.md#manual-workflows)
- [Replace the tasks demo](./spec/README.md) with your own specs
