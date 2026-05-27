# GitHub Copilot Instructions

> This file mirrors the project's [AGENTS.md](../AGENTS.md). Keep them in sync.

## Project Conventions

- Merge Tailwind classes with `cn()` from `@repo/utils` — not raw `clsx` or `twMerge`
- Add JSDoc with `@param`, `@returns`, `@example` on all exported functions and components
- **Environment (three layers):** `@repo/utils/env` + app wrappers (`apps/web/src/env.ts`); Convex uses `convex/lib/env.ts` `requireEnv` — never `process.env` in app code; do not import `@repo/utils` from Convex. See `docs/monorepo-structure.md`
- Prefer `@repo/utils/*` subpath imports over growing the root barrel
- Root `overrides`: keep `docs/dependency-overrides.md` in sync when pins change
- Use Convex `useQuery` / `useMutation` for server data — never `useEffect` + `fetch`
- After changes, verify with: `bun run lint && bun run typecheck && bun run test`

## Safety

- NEVER execute git commands that modify state (`add`, `commit`, `push`, `reset`)
- NEVER log or expose environment variables
