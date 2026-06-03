# Development reference

## Commands

Repo root ([package.json](../package.json)):

```bash
# Quality gate
bun run format:fix && bun run lint && bun run typecheck && bun run test

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

# Test / typecheck (codegen runs first when Convex is linked)
bun run typecheck             # tsc solution-wide, no emit
bun run typecheck:refs        # tsc -b (project references only)
bun run test                  # all workspaces with a test script
bun run test:web              # @repo/web, ui-web, utils unit tests
bun run test:packages         # @repo/config, env-core, ui-web, utils
bun run test:integration      # @repo/utils integration tests only

# E2E
bun run e2e:install           # Playwright Chromium (once per machine)
bun run e2e:smoke             # /tasks smoke (Clerk + Convex env required)

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
bun run --filter @repo/web e2e          # full Playwright suite (web)
bun run --filter @repo/marketing e2e    # Playwright (marketing)

# Setup — getting-started.md
bun scripts/setup.ts          # env templates, identity, codegen, doctor
bun scripts/doctor.ts         # toolchain, env, generated code
```

## Prerequisites

Install on your PATH:

- [Git](https://git-scm.com/download/)
- [Bun](https://bun.sh/) — match `.bun-version` (>= 1.3.14)
- [Node.js](https://nodejs.org/) — **24** (`.node-version`; `engines.node` is `>=24.0.0`)

CI and `bun scripts/doctor.ts` use the same major version. Recommended editors: [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/) (Copilot reads root [AGENTS.md](../AGENTS.md)).

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

Sample schema and handlers: `convex/schema.ts`, `convex/tasks.ts`, `convex/model/tasks.ts`. Auth: `convex/lib/auth.ts`. Link a deployment: [getting-started.md §3](./getting-started.md#3-convex) · [convex/README.md](../convex/README.md).

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

### E2E smoke (tasks)

Authenticated smoke for `/tasks` uses [`@clerk/testing`](https://clerk.com/docs/guides/development/testing/playwright/overview) and a real Convex deployment (your **dev** deployment from `bun run dev:convex` — never production).

1. `cp apps/web/.env.e2e.example apps/web/.env.e2e.local` and fill in secrets (or export before running tests).
2. In Clerk: enable **Email** and **Password**; create a dev user for `E2E_CLERK_USER_EMAIL` (or use a `+clerk_test` address per Clerk testing docs).
3. Set `CLERK_SECRET_KEY` (secret key, not publishable), `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` (same dev values as `apps/web/.env.local`). In GitHub Actions, `VITE_CONVEX_URL` must also be the **dev** URL — see [ci-cd.md](./ci-cd.md#e2e-tests-playwright).
4. Run:

```bash
bun run e2e:install
bun run e2e:smoke
```

CI job **`web-e2e-smoke`** runs on every PR that touches `apps/web/**`. Until GitHub Actions secrets are set, tests **skip** and the job logs a notice. Add `CLERK_SECRET_KEY` and `E2E_CLERK_USER_EMAIL` per [ci-cd.md](./ci-cd.md#github-actions-secrets). Optional: set `E2E_SMOKE_REQUIRE_SECRETS=1` so CI **fails** when smoke secrets are missing ([ci-cd.md](./ci-cd.md#optional-ci-guardrails)).

`bun scripts/setup.ts` runs `doctor` after codegen. Once Convex is linked, `doctor` also checks generated API and `VITE_*` env.

Implementation: `apps/web/tests/tasks.smoke.e2e.ts`, `playwright.smoke.config.ts` (single worker for Clerk).

### Full E2E (UI-only)

Home, routing, theme, and i18n tests do not require Clerk secrets:

```bash
bun run --filter @repo/web e2e
```

Run the full suite in CI manually: Actions → **E2E (full Playwright)** ([ci-cd.md](./ci-cd.md#full-e2e)). PRs only run smoke E2E automatically. CI does not run again after merge — see [ci-cd.md](./ci-cd.md#branch-protection).

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
