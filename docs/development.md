# Development reference

Patterns for day-to-day work after onboarding. **Onboarding:** [README](../README.md) → [getting-started.md](./getting-started.md). **Commands:** [package.json](../package.json) or [getting-started.md#commands](./getting-started.md#commands). **Repo map:** [monorepo-structure.md](./monorepo-structure.md). **CI/releases:** [ci-cd.md](./ci-cd.md).

## Prerequisites

Install on your PATH:

- [Git](https://git-scm.com/download/)
- [Bun](https://bun.sh/) — match `.bun-version` (>= 1.3.13)
- [Node.js](https://nodejs.org/) — **24** (`.node-version`; `engines.node` is `>=24.0.0`)

CI and `bun run doctor` use the same major version. Recommended editors: [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/) (Copilot reads root [AGENTS.md](../AGENTS.md)).

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

Sample schema and handlers: `convex/schema.ts`, `convex/tasks.ts`, `convex/model/tasks.ts`. Auth: `convex/lib/auth.ts`. Link a deployment: [getting-started.md](./getting-started.md#2-convex) · [convex/README.md](../convex/README.md).

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

Commands: [getting-started.md#test](./getting-started.md#test). CI: [ci-cd.md](./ci-cd.md#e2e-tests-playwright).

### E2E smoke (tasks)

Authenticated smoke for `/tasks` uses [`@clerk/testing`](https://clerk.com/docs/guides/development/testing/playwright/overview) and a real Convex dev deployment.

1. Copy [apps/web/.env.e2e.example](../apps/web/.env.e2e.example) values into your environment (or export before running tests).
2. In Clerk: enable **Email** and **Password**; create a dev user for `E2E_CLERK_USER_EMAIL` (or use a `+clerk_test` address per Clerk testing docs).
3. Set `CLERK_SECRET_KEY` (secret key, not publishable), `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` (same as `apps/web/.env.local`).
4. Run:

```bash
bun run e2e:install
bun run e2e:smoke
```

CI job **`web-e2e-smoke`** runs on every PR that touches `apps/web/**`. Until GitHub Actions secrets are set, tests **skip** and the job logs a notice. Add `CLERK_SECRET_KEY` and `E2E_CLERK_USER_EMAIL` per [ci-cd.md](./ci-cd.md#github-actions-secrets). Optional: set `E2E_SMOKE_REQUIRE_SECRETS=1` so CI **fails** when smoke secrets are missing ([ci-cd.md](./ci-cd.md#optional-ci-guardrails)).

`bun run setup` runs `doctor --bootstrap` (toolchain + routes only). `bun run doctor -- --strict` adds backend env and E2E checks.

Implementation: `apps/web/tests/tasks.smoke.e2e.ts`, `playwright.smoke.config.ts` (single worker for Clerk).

### Full E2E (UI-only)

Home, routing, theme, and i18n tests do not require Clerk secrets:

```bash
bun run --filter @repo/web e2e
```

On PRs, add the **`e2e`** label for the full Playwright suite on `main` or labeled PRs.

CSP for production-like E2E: [security-headers.md](./security-headers.md).

### Visual regression

Not included in this template. Playwright visual snapshots are not wired in CI. Add your own `*.visual.e2e.ts` files and tag tests with `@visual` if you need them.

### Unit vs integration tests

- Default: `bun run test` (unit tests; `*.integration.test.ts` excluded in `@repo/utils`)
- Integration: `bun run test:integration` (also runs in CI when `apps/web/**` or shared packages change — see `tests-web` in [ci-cd.md](./ci-cd.md#ci-and-test-jobs))
- Web stack: `bun run test:web`

`apps/web` Vitest sets `VITE_CONVEX_URL` to a placeholder and imports `@repo/test-utils/convex-react-setup` in `setupTests.ts` so `convex/react` hooks do not call a live deployment. Override mocks per test when you need specific query data.

### Optional: Chrome DevTools MCP

```bash
code --add-mcp '{"name":"chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp@latest"]}'
```

## Related

Doc map: [README](../README.md#resources). Also [dependency-overrides.md](./dependency-overrides.md), [CONTRIBUTING.md](../CONTRIBUTING.md).
