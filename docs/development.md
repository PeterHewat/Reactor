# Development reference

Patterns for day-to-day work after onboarding. **Onboarding:** [README](../README.md) → [getting-started.md](./getting-started.md). **Commands:** [package.json](../package.json) or [getting-started.md#commands](./getting-started.md#commands). **Repo map:** [monorepo-structure.md](./monorepo-structure.md). **CI/releases:** [ci-cd.md](./ci-cd.md).

## Prerequisites

Install on your PATH:

- [Git](https://git-scm.com/download/)
- [Bun](https://bun.sh/) — match `.bun-version` (>= 1.3.13)
- [Node.js](https://nodejs.org/) — 24 recommended (`.node-version`); >= 22.12 for marketing (Astro 6)

CI uses Node 24. Recommended editors: [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/) (Copilot reads root [AGENTS.md](../AGENTS.md)).

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

Commands: [getting-started.md#test](./getting-started.md#test). CI labels: [ci-cd.md](./ci-cd.md#e2e-tests-playwright).

**With Convex:** WebSocket traffic is not `**/api/**`. Prefer a real dev deployment (`VITE_CONVEX_URL` in `apps/web/.env.local`) and assert UI state; or keep UI-only tests (theme, i18n) as in the template today.

```ts
await page.route("https://your-project.convex.cloud/**", (route) => {
  route.fulfill({ status: 200, body: "{}" });
});
```

CSP for production-like E2E: [security-headers.md](./security-headers.md).

### Optional: Chrome DevTools MCP

```bash
code --add-mcp '{"name":"chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp@latest"]}'
```

## Related

Doc map: [README](../README.md#resources). Also [dependency-overrides.md](./dependency-overrides.md), [CONTRIBUTING.md](../CONTRIBUTING.md).
