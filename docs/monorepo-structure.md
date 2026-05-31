# Monorepo structure

Technical map of layout, configuration, and growth conventions. **Onboarding:** [README](../README.md) → [getting-started.md](./getting-started.md). **Commands:** [package.json](../package.json) or [getting-started.md#commands](./getting-started.md#commands). **Business design:** [architecture.md](./architecture.md). **Day-2 patterns:** [development.md](./development.md).

## Layout

```text
apps/web/           # Product UI — workspace deps on @repo/*
apps/marketing/     # Astro site — no workspace package deps
packages/utils/     # Shared client utilities (@repo/utils)
packages/tokens/    # Shared CSS variables (@repo/tokens)
packages/ui-web/    # Shared React components (@repo/ui-web)
packages/test-utils/# Test fixtures (dev/test only)
packages/config/    # Shared path aliases for Vite/Vitest (not a workspace package)
convex/             # Backend — no @repo imports; Convex CLI root
docs/               # Human + agent documentation
```

## Dependency graph

```text
@repo/test-utils  (dev/test)
        ↑
@repo/utils
        ↑
@repo/ui-web
        ↑
@repo/web

@repo/marketing   (standalone)
@repo/convex      (standalone)
```

## Environment variables (three layers)

| Layer          | Code                        | Runtime                     | Use                                                           |
| -------------- | --------------------------- | --------------------------- | ------------------------------------------------------------- |
| Generic loader | `packages/utils/src/env.ts` | Any (with a source adapter) | `loadEnv`, `asString`, `asInt`, `asBoolean`                   |
| Web app        | `apps/web/src/env.ts`       | Vite / browser              | Schema + `import.meta.env` via `loadWebEnv` / `requireWebEnv` |
| Convex server  | `convex/lib/env.ts`         | Convex dashboard vars       | `requireEnv` — reads `process.env` in Convex only             |

Do **not** import `@repo/utils` from Convex: the package has React peer deps and Zustand. A future `packages/env-core` (no UI deps) could share parsers only if needed.

### Env file map

| Template                   | Copy to               | Scope                                                                |
| -------------------------- | --------------------- | -------------------------------------------------------------------- |
| `.env.example` (repo root) | `.env.local` (root)   | `CONVEX_DEPLOYMENT`, `CLERK_JWT_ISSUER_DOMAIN` (Convex/Clerk wiring) |
| `apps/web/.env.example`    | `apps/web/.env.local` | `VITE_*` for the web app                                             |

## Path aliases

TypeScript paths live in [tsconfig.paths.json](../tsconfig.paths.json) (extended by `tsconfig.base.json`). Vite and Vitest consume the same targets via [packages/config/aliases.ts](../packages/config/aliases.ts). When adding a workspace package, update both files.

Subpath imports for `@repo/utils` (prefer narrow imports in new code):

- `@repo/utils` — `cn()` and barrel re-exports
- `@repo/utils/env`, `./theme`, `./i18n`, `./storage`, `./use-translation`

## Typecheck vs build

| Script           | Command                                | Purpose                                                                                  |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `typecheck`      | `tsc -p tsconfig.json --noEmit`        | Solution-wide check, no emit                                                             |
| `typecheck:refs` | `tsc -b`                               | Verify project references only                                                           |
| `build`          | `tsc -b`                               | Emit `.d.ts` for composite packages (`emitDeclarationOnly`) — **not** Vite/Astro bundles |
| `build:all`      | `build` + `bun run --filter '*' build` | Solution `tsc -b`, then each workspace `build` (skips packages without a script)         |

Convex has no local bundle artifact — `@repo/convex` `build` is `tsc --noEmit`; production upload is `convex deploy` / CI, not root `build`.

App production builds: `bun run --filter @repo/web build`, `bun run --filter @repo/marketing build`.

## Root `test` script

`bun run test` runs `bun run --filter '*' test`, so any workspace that defines a `test` script is included automatically (e.g. `@repo/test-utils` has no `test` script and is skipped).

## Release tags

Deploy workflows use tags: `web-v*`, `marketing-v*`, `convex-v*`. See [ci-cd.md](./ci-cd.md).

## Generated code (not committed)

| Output                                | Generator                 | Command                                                     |
| ------------------------------------- | ------------------------- | ----------------------------------------------------------- |
| `convex/_generated/`                  | Convex                    | `bun run generate:convex` (or `bun run dev:convex`)         |
| `apps/web/src/routeTree.gen.ts`       | TanStack Router           | `bun run generate:routes` (or `tsr generate` in `apps/web`) |
| `.agents/skills/`, `skills-lock.json` | Convex `ai-files install` | `bun run generate:ai` (part of `bun run generate`)          |

Run **`bun run generate`** before typecheck when cloning fresh (also runs automatically via `pretypecheck` / `pretest`). Keep **[CLAUDE.md](../CLAUDE.md)** in sync with **[AGENTS.md](../AGENTS.md)** when editing rules (`generate:ai` only patches the marked Convex section at the bottom).

- Gitignored in `.gitignore`
- ESLint ignores `convex/_generated/`; Prettier ignores both paths (see `.prettierignore`)
- CI: `bun run typecheck` triggers `pretypecheck` → `generate`. Convex uses `convex codegen` when `.env.local` / `CONVEX_DEPLOY_KEY` exists; otherwise `convex dev --once` (local deployment for fresh template copies)

## Starter growth thresholds

Current flat/small layout is intentional. Add structure when the product earns it:

| Trigger                                                                     | Action                            |
| --------------------------------------------------------------------------- | --------------------------------- |
| Multiple app-local components reused outside `App.tsx`                      | `apps/web/src/components/`        |
| A domain owns UI, hooks, helpers, tests, and copy together                  | `apps/web/src/features/<domain>/` |
| Convex handlers share rules, exceed ~200 lines, or need plain-TS unit tests | `convex/model/<domain>.ts`        |

### Target shape for `apps/web/src/`

Use [apps/marketing/src/](../apps/marketing/src/) as the reference layout once web grows:

```text
components/   layouts/   lib/   pages/   styles/   content/   (as needed)
```

The starter ships one feature module as a reference: `apps/web/src/features/tasks/` (UI + `useTasks` hook), paired with `convex/model/tasks.ts`.

## Package authoring

See [ADR-002: Package boundary authoring](./adr/002-package-boundary-authoring.md) and package READMEs under `packages/utils/` and `packages/ui-web/`.

## Dependency overrides

Root `package.json` `overrides` pin transitive versions for security. Rationale and version table: [dependency-overrides.md](./dependency-overrides.md). Update that doc whenever overrides change.

## Further reading

Doc map: [README](../README.md#resources). Also [platforms.md](./platforms.md), [agent-guidance.md](./agent-guidance.md).
