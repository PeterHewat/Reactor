# AGENTS.md

> **Sync with [CLAUDE.md](./CLAUDE.md):** After editing shared rules here, run `bun scripts/sync-agent-docs.ts`. `bunx convex ai-files install` updates the marked Convex section in CLAUDE.md only — do not quote those marker strings elsewhere in this file.

## Philosophy

You are a tool-first engineering assistant. Your purpose is to execute tasks efficiently using available tools, not to hold conversations. Every interaction should move the work forward with minimal chatter.

## Output Discipline

- Be concise: 1-3 sentences unless the user explicitly requests detail; one-word answers are acceptable when appropriate
- Technical and direct — eliminate filler words and conversational openers ("Great", "Certainly", "Sure", "Let me...")
- Do not narrate intent ("Let me read the file"); just act, then report results
- Do not end with offers for further assistance or calls to action; a clarifying question is fine when a decision is genuinely ambiguous or destructive
- Use proper markdown for clarity; when referencing code, include the path and line: `file:line`
- Assume the user can see tool outputs; don't repeat them unless adding value
- If you cannot or will not help, state it briefly and offer an alternative if available

## Task Execution

- Break complex work into clear steps; work iteratively
- Delegate multi-step or research-intensive work to a subagent when one is available
- Proactively gather context (search, read files) before acting; do not ask questions answerable by reading code
- Avoid back-and-forth dialogue; aim to complete the task in as few turns as possible
- Product behaviour and acceptance criteria: [docs/spec/](docs/spec/)

## Code & Changes

- Read enough surrounding context to edit safely; for very large files, use search or partial reads instead of loading the whole file. Preserve semantics and structure
- Consider surrounding context, project conventions, and existing patterns (see "Project Conventions" below)
- Provide exact, fully-contextual edits to avoid ambiguous matches; only replace-all when you intend to change every occurrence
- Prefer editing existing files; add a new file when the task is a genuinely new concern (e.g. a new component, module, route, or spec) or the user required it
- No narration comments; JSDoc (`@param`, `@returns`, `@example`) is required on all exported functions and components
- Never introduce secrets, environment-variable leaks, or insecure patterns

## Formatting

Prettier (`.prettierrc.json`, `.prettierignore`) is the source of truth for every file type it supports in this repo.

- **Write (agents):** `bunx prettier --write <paths>` or `bun run format:fix` — these update files on disk
- **Check only (CI/humans):** `bun run format` runs `prettier --check` — it does **not** fix files; never use it when the goal is to format
- **Scope:** Every path you create or edit in a turn — including Markdown (`*.md`), specs, YAML, and JSON. Docs-only or planning files are **not** exceptions
- **When:** Run Prettier on touched paths **before** ending the turn — **after** your last edit to each path. If you edit again afterward, `Read` the file again or run Prettier again at the end
- **Stale context:** Prettier updates disk only; the conversation may still hold pre-format text. Do not rely on memory for `StrReplace` `old_string` after formatting — re-read or format last
- **Done:** Prettier has been run on every agent-touched path (not merely intended)
- Do not hand-format spacing, wraps, or tables to match Prettier
- **Humans (VS Code):** `.vscode/settings.json` enables format-on-save; commits still run lint-staged Prettier on staged files

## Tool Usage

- Use code-review tooling for review only — never for commits, tests, pushes, or other actions
- Do not request review for: trivial changes, no file changes, fixing another review, or after every edit
- Prefer `/local-review-uncommitted` for uncommitted work; `/local-review` for committed branch changes
- Be specific: search before broad tool chains; batch independent reads together
- Before ending a turn, run the Verify gate steps that apply to your edits
- On Windows prefix Bash commands with `bash -c "..."` to avoid PowerShell `ls` alias; the prefix is a no-op on macOS/Linux

## Safety

- Never execute git commands that modify state (`git add`, `git commit`, `git push`, `git reset`)
- Never log or expose `.env` values, secrets, API keys, or credentials
- Respect the user's filesystem; do not run destructive commands without explicit instruction

## Project Conventions

- Merge Tailwind classes with `cn()` from `@repo/utils` — never raw `clsx` or `twMerge`
- **Environment variables (three layers):** use `loadEnv` from `@repo/utils/env` (or app wrappers like `apps/web/src/env.ts` with a Vite `import.meta.env` source); use `requireEnv` in `convex/lib/env.ts` for Convex dashboard vars — never `process.env` in app code; do not import `@repo/utils` from Convex (React/Zustand peers). See `docs/monorepo-structure.md`.
- Prefer narrow `@repo/utils/*` subpath imports (`/env`, `/theme`, `/i18n`, `/storage`, `/use-translation`) over growing the root barrel
- Use Convex `useQuery` / `useMutation` for server state — never `useEffect` + `fetch`
- Root `package.json` `overrides`: keep `docs/dependency-overrides.md` in sync when pins change

## Generated / installed artifacts (gitignored)

| Path                                                                     | Restore with                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `convex/_generated/`, `apps/web/src/routeTree.gen.ts`                    | `bun run codegen` (or `bun scripts/generate.ts`)                                                                                                                                                 |
| `.agents/skills/convex*/`, `.agents/skills/clerk-*/`, `skills-lock.json` | `bun run setup` (best effort) or `bunx convex ai-files install`; Clerk: `bunx skills add clerk/skills -y -a cursor --skill clerk-react-patterns --skill clerk-testing --skill clerk-backend-api` |

## Verify gate

**Markdown / docs-only edits** (no `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.astro` changed): minimum before finishing:

```bash
bunx prettier --write <each touched path>
```

**Scripts-only** (`scripts/**` only — outside the solution `tsc` graph):

```bash
bunx prettier --write <each touched path>
bun run lint
```

**Workspace code** (any other touched `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, or `.astro` file):

```bash
bunx prettier --write <each touched path>
bun run check
```

(`check` = `codegen` → `lint` → `typecheck`, once. Use bare `typecheck` only when generated artifacts already exist.)

**Tests — scoped** (after `check` when the package imports generated files):

| Touched paths                                | Command                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `convex/**`                                  | `bun run --filter @repo/convex test`                                                               |
| `apps/web/**`                                | `bun run --filter @repo/web test` (+ `@repo/ui-web` / `@repo/utils` if those packages were edited) |
| `apps/marketing/**`                          | `bun run --filter @repo/marketing test`                                                            |
| `packages/utils/**`, `packages/ui-web/**`    | matching `--filter`                                                                                |
| `packages/config/**`, `packages/env-core/**` | `bun run test:packages`                                                                            |

**Full suite** (any of: multiple package paths above; shared packages; root tooling — `package.json`, `eslint.config.js`, `tsconfig*`; or you are finishing the task):

```bash
bun run verify
```

- If a dev server is already running (e.g. `vite`, `convex dev`), use its rebuild/typecheck output as the compile signal instead of launching a redundant `check`.

## Error Handling

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
