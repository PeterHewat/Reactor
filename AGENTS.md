# AGENTS.md

> **Claude Code:** [CLAUDE.md](./CLAUDE.md) is a symlink to this file. `bunx convex ai-files install` updates the marked Convex section below in both paths — do not quote those marker strings elsewhere in this file.

## Agent behavior

- Execute with tools; stay concise (1–3 sentences unless the user wants detail)
- Gather context from the codebase before asking questions; product criteria: [docs/spec/](docs/spec/)
- Prefer editing existing files; JSDoc (`@param`, `@returns`, `@example`) on exported functions and components
- No secrets in code or logs; no `git add` / `commit` / `push` / `reset` unless the user asks
- Reference code as `path:line`; run the [verify gate](#verify-gate) before finishing

## Project conventions

- Merge Tailwind with `cn()` from `@repo/utils` — not raw `clsx` / `twMerge`
- **Env (three layers):** `loadEnv` from `@repo/utils/env` (or app wrappers like `apps/web/src/env.ts`); `requireEnv` in `convex/lib/env.ts` for Convex dashboard vars — never `process.env` in app code; do not import `@repo/utils` from Convex. See [docs/monorepo-structure.md](docs/monorepo-structure.md).
- Prefer `@repo/utils/*` subpaths (`/env`, `/theme`, `/i18n`, …) over the root barrel
- Server state: Convex `useQuery` / `useMutation` — not `useEffect` + `fetch`
- Root `package.json` `overrides`: keep [docs/dependency-overrides.md](docs/dependency-overrides.md) in sync when pins change

## Generated artifacts (gitignored)

| Path                                                                     | Restore                                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `convex/_generated/`, `apps/web/src/routeTree.gen.ts`                    | `bun run codegen`                                                                                        |
| `.agents/skills/convex*/`, `.agents/skills/clerk-*/`, `skills-lock.json` | `bun run setup` or [docs/monorepo-structure.md](docs/monorepo-structure.md#generated-code-not-committed) |

Repo-owned skills (e.g. `.agents/skills/pr-push/`) are committed under `.agents/skills/`; `.claude/skills` is a symlink to that directory for Claude Code.

## Verify gate

Before ending a turn, run what applies to your edits:

| Change                                                           | Command                                    |
| ---------------------------------------------------------------- | ------------------------------------------ |
| Docs / Markdown only                                             | `bunx prettier --write <touched paths>`    |
| `scripts/**` only                                                | Prettier on touched paths + `bun run lint` |
| Any `.ts` / `.tsx` / `.js` / `.jsx` / `.mjs` / `.cjs` / `.astro` | Prettier + `bun run check`                 |
| Task complete or broad changes                                   | `bun run verify`                           |

Use `bunx prettier --write` (not `bun run format`, which is check-only). Scoped tests, Prettier edge cases, and review tooling: [docs/development.md § Agent workflow](docs/development.md#agent-workflow).

If `vite` or `convex dev` is already running, use its compile output instead of a redundant `check`.

## Error handling

- If a tool fails, analyze the error and retry with correction if possible
- Do not blame the user or environment; adapt and find alternatives
- If truly blocked, state what failed and one concrete next step — factually, without rhetorical questions

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
