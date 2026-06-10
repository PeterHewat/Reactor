# Development reference

## Agent workflow

Extended rules for Cursor, Claude Code, and Copilot (trimmed summary in [AGENTS.md](../AGENTS.md)).

### Formatting

Prettier (`.prettierrc.json`) is the source of truth. Agents: `bunx prettier --write <paths>` on every touched path before ending the turn (including Markdown and JSON). Humans: format-on-save in `.vscode/settings.json`; CI uses `prettier --check` via `bun run format`.

### Verify gate (full)

After `bun run check` when workspace code changed:

| Touched paths                                        | Command                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `convex/**`                                          | `bun run --filter @repo/convex test`                                           |
| `apps/web/**`                                        | `bun run --filter @repo/web test` (+ `@repo/ui-web` / `@repo/utils` if edited) |
| `apps/marketing/**`                                  | `bun run --filter @repo/marketing test`                                        |
| `packages/utils/**`, `packages/ui-web/**`            | matching `--filter`                                                            |
| `packages/config/**`, `packages/env-core/**`         | `bun run test:packages`                                                        |
| Multiple packages, root tooling, or finishing a task | `bun run verify`                                                               |

### Code review tooling

- Review only — not for commits, tests, or pushes
- Skip for trivial edits or when fixing a prior review
- Prefer `/local-review-uncommitted` for uncommitted work; `/local-review` for branch changes

### Windows quirks

Windows 11+, Developer Mode activated, and latest Git for Windows.

Prefix Bash commands with `bash -c "..."` when a shell alias would break POSIX tools (no-op on macOS/Linux).

## Commands

Repo root ([package.json](../package.json)):

```bash
# Quality gate (see AGENTS.md and § Agent workflow below)
bun run check                       # codegen + lint + typecheck after workspace code edits
bun run verify                      # check + full test suite at task completion
bun run --filter @repo/web test     # scoped tests (mirror CI path detection)

# Dev
bun run dev                   # web + marketing
bun run dev:full              # web + marketing + convex
bun run dev:web               # Vite :5173
bun run dev:marketing         # Astro :4321
bun run dev:convex            # Convex (repo root)

# Lint / format
bun run lint                  # ESLint (repo root)
bun run format                # Prettier check
bun run format:fix            # Prettier write

# Codegen / check / test
bun run codegen               # generate routes + Convex (when linked), assert artifacts
bun run check                 # codegen + lint + typecheck (CI and default agent gate)
bun run verify                # check + all workspace tests
bun run typecheck             # tsc solution-wide, no emit (artifacts must already exist)
bun run typecheck:refs        # tsc -b (project references only)
bun run test                  # all workspaces with a test script (run check or codegen first)
bun run test:web              # @repo/web, ui-web, utils unit tests
bun run test:packages         # @repo/config, env-core, ui-web, utils
bun run test:integration      # @repo/utils integration tests only

# E2E
bun run e2e:install           # Playwright Chromium (once per machine)
bun run --filter @repo/web e2e

# Dependencies
bun install                   # install workspaces (same as install:all)
bun run install:all           # alias for bun install
bun run outdated              # list available updates
bun run update                # bump within semver ranges in package.json
bun run audit                 # security audit (CI uses --audit-level=high)

# Build / clean
bun run build                 # tsc -b (project references)
bun run build:all             # tsc -b + each workspace build script
bun run clean                 # rm node_modules — then bun install
bun run clean:ts              # tsc -b --clean

# Per workspace
bun run --filter @repo/web build        # Vite production build
bun run --filter @repo/web e2e          # Playwright (web)
bun run --filter @repo/marketing e2e    # Playwright (marketing)

# Setup — getting-started.md (identity, Clerk, Convex, GitHub, Vercel, DNS hints)
bun run setup          # interactive wizard + readiness (re-run anytime; Enter keeps defaults)
```

## Prerequisites

### Local tooling

| Tool                                      | How to run    | Install                                                      |
| ----------------------------------------- | ------------- | ------------------------------------------------------------ |
| [Git](https://git-scm.com/download/)      | `git`         | System package                                               |
| [Bun](https://bun.sh/)                    | `bun`         | Match `.bun-version` (>= 1.3.14)                             |
| [Node.js](https://nodejs.org/)            | `node`        | **24** (`.node-version`)                                     |
| [GitHub CLI](https://cli.github.com/)     | `gh`          | Global — `brew install gh`; `gh auth login -s repo,workflow` |
| [Convex CLI](https://docs.convex.dev/cli) | `bunx convex` | Root `devDependency` — `bun install`                         |
| [Vercel CLI](https://vercel.com/docs/cli) | `bunx vercel` | Root `devDependency` — `bun install`                         |
| [Clerk CLI](https://clerk.com/docs/cli)   | `bunx clerk`  | Root `devDependency` — `bun install`                         |

Repo-pinned CLIs use the versions in root `package.json`. Only `gh` is expected as a global/system binary.

### Accounts (free tiers; signup in the wizard if needed)

- [GitHub](https://github.com/) — template repo + `gh auth login`
- [Convex](https://convex.dev/) — browser login during the Convex setup step
- [Clerk](https://clerk.com/) — create an app during the Clerk setup step
- [Vercel](https://vercel.com/) — account before the Vercel step (API token)
- **Apex domain** (optional at first) — when set, setup delegates DNS to Vercel via nameservers at your registrar (e.g. OVH)

CI and local scripts use the same Node/Bun major versions. Recommended editors: [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/) (Copilot reads root [AGENTS.md](../AGENTS.md)).

## Tailwind and UI

Semantic tokens (avoid arbitrary values): `text-primary`, `bg-muted`, `rounded-md`, spacing scale, typography utilities.

- **Web:** Tailwind v4 `@theme` in `apps/web/src/index.css` + `@repo/tokens/theme.css`
- **Marketing:** same tokens in `apps/marketing/src/styles/global.css`
- **Class merging:** `cn()` from `@repo/utils`

Add shadcn components from `packages/ui-web`:

```bash
cd packages/ui-web && bunx shadcn@latest add button
```

Import in client components:

```tsx
import { Button } from "@repo/ui-web";

export function Example() {
  return <Button variant="primary">Click me</Button>;
}
```

Marketing content: `apps/marketing/src/pages/`, `src/components/`, theme in `src/styles/`. Stack notes: [apps/marketing/README.md](../apps/marketing/README.md).

## Typed environment (`@repo/utils/env`)

Generic loader for non-Vite contexts (do not use raw `process.env` in app code). Web and Convex have dedicated wrappers — see [monorepo-structure.md#environment-variables-three-layers](./monorepo-structure.md#environment-variables-three-layers).

```ts
import { loadEnv, asString, asBoolean, asInt } from "@repo/utils/env";

const env = loadEnv({
  CLERK_SECRET_KEY: { key: "CLERK_SECRET_KEY", parse: asString },
  ENABLE_EXPERIMENTS: {
    key: "ENABLE_EXPERIMENTS",
    parse: asBoolean,
    optional: true,
    defaultValue: false,
  },
  PORT: { key: "PORT", parse: asInt, optional: true, defaultValue: 3000 },
});
```

## Convex patterns

Sample schema and handlers: `convex/schema.ts`, `convex/tasks.ts`, `convex/model/tasks.ts`. Auth: `convex/lib/auth.ts`. Env and deployment: [getting-started.md](./getting-started.md) · [convex/README.md](../convex/README.md).

**Client:** `useQuery` / `useMutation` for data; `useConvexAuth()` for auth — not `fetch` + `useEffect`.

**Unit tests** (`convex-test`, `withIdentity`):

```ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

test("create inserts a task for the signed-in user", async () => {
  const t = convexTest(schema, modules).withIdentity({ subject: "user_abc" });
  const id = await t.mutation(api.tasks.create, { title: "Test task" });
  expect(id).toBeDefined();
});
```

## E2E tests (Playwright)

CI: [ci-cd.md](./ci-cd.md#e2e-tests-playwright).

Web specs: `apps/web/tests/*.e2e.ts` via `playwright.config.ts`. Env vars: comments in [apps/web/.env.example](../apps/web/.env.example); base setup in [getting-started.md](./getting-started.md).

1. Run `bun run setup` with a development `CLERK_SECRET_KEY` — it defaults `E2E_CLERK_USER_EMAIL` to `e2e.test@your-apex-domain`, creates the Clerk user via API when missing, and syncs the email to GitHub secrets. In Clerk, enable **Email** and **Password** (Development) before the create step. Playwright signs in with `@clerk/testing` ticket tokens — no password secret in CI.
2. Run:

```bash
bun run e2e:install
bun run --filter @repo/web e2e
```

`tasks.e2e.ts` uses [`@clerk/testing`](https://clerk.com/docs/guides/development/testing/playwright/overview) against your **dev** Convex deployment (`VITE_CONVEX_URL` from `bun run dev:convex` — never production). It runs only when Clerk/Convex E2E env is set; otherwise Playwright runs **UI-only** (`home.e2e.ts`, `routing.e2e.ts`).

Playwright does **not** run on pull requests. In CI: Actions → **E2E** → **Run workflow** ([ci-cd.md](./ci-cd.md#e2e-tests-playwright)); UI-only runs without secrets; full suite needs [repository secrets](./ci-cd.md#repository-secrets) including `CONVEX_DEPLOY_KEY`.

PR CI runs `test:coverage` in path-based jobs (`@repo/web` + `@repo/ui-web` enforce thresholds when `apps/web` changes; `@repo/config`, `@repo/env-core`, `@repo/marketing`, `@repo/convex` when those paths change).

Re-run `bun run setup` when local setup is complete ([getting-started.md](./getting-started.md)).

CSP on deploys: `apps/web/vercel.json` — [prompts/security-review.md](../prompts/security-review.md).

### Visual regression

Not included in this template. Playwright visual snapshots are not wired in CI. Add your own `*.visual.e2e.ts` files and tag tests with `@visual` if you need them.

### Unit vs integration tests

- Default: `bun run test` (unit tests; `*.integration.test.ts` excluded in `@repo/utils`)
- Integration: `bun run test:integration` (also in CI when web/shared paths change — [ci-cd.md](./ci-cd.md#ci-behavior))
- Web stack: `bun run test:web`

`apps/web` Vitest sets `VITE_CONVEX_URL` to a placeholder and imports `@repo/test-utils/convex-react-setup` in `setupTests.ts` so `convex/react` hooks do not call a live deployment. Override mocks per test when you need specific query data.

### Optional: Chrome DevTools MCP

```bash
code --add-mcp '{"name":"chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp@latest"]}'
```
