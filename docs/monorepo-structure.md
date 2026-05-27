# Monorepo structure

Technical map of layout, configuration, and growth conventions. For business/system design, use [architecture.md](./architecture.md). For first-time setup, see [setup.md](./setup.md).

## Layout

```text
apps/web/           # Product UI — workspace deps on @repo/*
apps/marketing/     # Astro site — no workspace package deps
packages/utils/     # Shared client utilities (@repo/utils)
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

## `convex/_generated/`

Generated files are **committed** so `bun run typecheck` works without `convex dev`. ESLint and Prettier ignore them; they are not gitignored.

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

Marketing already nests by concern; web is mostly flat today (`locales/` is the only grouped folder).

## Package authoring

See [ADR-002: Package boundary authoring](./adr/002-package-boundary-authoring.md) and package READMEs under `packages/utils/` and `packages/ui-web/`.

## Dependency overrides

Root `package.json` `overrides` pin transitive versions for security. Rationale and version table: [dependency-overrides.md](./dependency-overrides.md). Update that doc whenever overrides change.

## Further reading

- [platforms.md](./platforms.md) — apps, packages, CI expectations
- [agent-guidance.md](./agent-guidance.md) — AGENTS.md, Copilot, prompts, ADRs
- [setup.md](./setup.md) — local dev and env setup
