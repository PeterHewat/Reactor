# AGENTS.md

## Project Conventions

- Merge Tailwind classes with `cn()` from `@repo/utils` — not raw `clsx` or `twMerge`
- Add JSDoc with `@param`, `@returns`, `@example` on all exported functions and components
- Use the `env.ts` abstraction (`packages/utils/src/env.ts`) for environment variables — never access `process.env` directly
- Use Convex `useQuery` / `useMutation` for server data — never `useEffect` + `fetch`
- After changes, verify with: `bun run lint && bun run typecheck && bun run test`

## Safety

- NEVER execute git commands that modify state (`add`, `commit`, `push`, `reset`)
- NEVER log or expose environment variables
