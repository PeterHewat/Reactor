# Structural Evaluation of Reactor Monorepo

Structural assessment of layout, boundaries, configuration, and maintainability conventions. Technology stack choices are out of scope.

## Executive Summary

Reactor’s structure is **coherent and opinionated**: clear `apps/` / `packages/` / root `convex/` split, enforced verify commands (`lint && typecheck && test`), strong CI/docs/tooling, and deliberate marketing isolation. Main structural debt is **export surface concentration** (`@repo/utils` barrel), **path alias duplication** across five config files, **undocumented env/runtime exceptions** for Convex (plus multi-file `.env` templates), an **enumerated root `test` filter list** that must be edited on every package add, **`overrides` doc drift** (`docs/dependency-overrides.md` exists but is not linked from `package.json` and can fall behind pins), **scattered structural docs** (no monorepo index; `docs/architecture.md` is intentionally a business template), and **organizational asymmetry between `apps/web/src/` (mostly flat) and `apps/marketing/src/` (nested by concern)** — not folder layout or monorepo shape.

---

## 1. Directory Layout

### Current Structure

```text
Reactor/
├── apps/
│   ├── web/          # Product UI (workspace deps on @repo/*)
│   └── marketing/    # Astro static site (no workspace package deps)
├── packages/
│   ├── utils/        # Shared utilities (@repo/utils)
│   ├── ui-web/       # Shared React components (@repo/ui-web)
│   └── test-utils/   # Test fixtures (@repo/test-utils)
├── convex/           # Backend (Bun workspace @repo/convex; Convex CLI root path)
├── docs/             # Setup, platforms, CI/CD, ADRs, dependency-overrides
├── prompts/          # AI agent prompt templates (README-linked)
├── scripts/          # DevOps utilities (minimal)
└── .github/          # CI/CD, Dependabot, release, Copilot mirror of AGENTS.md
```

### Layout strengths

- Clear separation: apps own runtime, packages own shared client/test code, `convex/` owns backend.
- Flat `apps/` and `packages/` naming is discoverable.
- Root config colocation (`package.json`, `tsconfig.base.json`, `eslint.config.js`, `.env.example`) matches workspace expectations.
- `README.md` (257 lines) includes a **documentation index** that cross-references all 8 docs files (`setup`, `platforms`, `ci-cd`, `architecture`, `security-headers`, `product`, `dependency-overrides`, `adr/`) and a **Core Commands** table.
- `prompts/` has 11 prompt templates (accessibility, architecture-decision, bug-fix, code-review, documentation, feature-development, performance, refactor, README, security-review, testing) — README-linked.
- `scripts/sync-github-labels.sh` — 1 operational shell script; remainder is `.github/workflows/`.
- E2E uses Page Object Model (`apps/web/tests/pom/`).
- `convex/` at root is **required** by `convex.json` (`"functions": "convex/"`) — not a layout flaw.

### Layout weaknesses

- `prompts/` is top-level tooling-adjacent content; optional move to `.github/prompts/` or `tooling/` if the root should stay minimal (update README links).
- `scripts/` is minimal (one shell script); most automation lives under `.github/workflows/`.
- `apps/web/src/` is **mostly flat** (no `components/` or `features/` yet; only `locales/` is grouped) — fine for a starter; document adoption thresholds rather than treating this as current debt.
- **Organizational asymmetry inside `apps/`**: `apps/marketing/src/` already nests by concern (`components/`, `layouts/`, `lib/`, `pages/`, `styles/`, `content/`) while `apps/web/src/` keeps most files at the root of `src/`. Document marketing’s nesting as the target shape for web once it grows.
- **Structural docs are fragmented**: decisions live in `docs/platforms.md`, `docs/setup.md`, ADRs, and README. `docs/architecture.md` is a **business-architecture template** (non-technical stakeholders) — do not repurpose it as the monorepo index. Add `docs/monorepo-structure.md` (or a dedicated section in `platforms.md`) for env layers, aliases, release tags, and growth thresholds.

---

## 2. Module Separation

### Dependency Graph (Actual)

```text
@repo/test-utils          (dev/test only)
        ↑
@repo/utils               (cn, env, storage, theme, i18n, React hooks/stores)
        ↑
@repo/ui-web              (React components)
        ↑
@repo/web

@repo/marketing           (standalone — no workspace:* deps)

@repo/convex              (standalone — convex/lib/* only; no @repo imports)
```

### Module separation strengths

- Acyclic, one-way client dependency flow; no circular workspace references.
- `apps/marketing` isolation avoids accidental React/Convex coupling.
- `ui-web` barrel re-exports component types — clean consumer API.
- Convex cross-cutting code in `convex/lib/` (`auth`, `validation`, `env`).
- **App env boundary** (`apps/web/src/env.ts`): wraps `loadEnv` with a Vite-specific source adapter and optional vs required schemas — good pattern to replicate for other apps.

### Module separation weaknesses

- **`@repo/utils` barrel, not file layout**: Source has **14 files** across **5 concern modules** (`env`, `i18n`, `storage`, `theme`, `use-translation`) but `packages/utils/src/index.ts` re-exports everything from one entry. The package boundary feels “god-like”; subpath exports fix most of the pain without new packages.
- **No authoring policy for package boundaries**: there is no documented rule (ADR or package README) for what belongs in `utils` vs `ui-web` vs a future package. Subpath exports cure today’s symptom; an authoring rule prevents future barrel sprawl.
- **`docs/platforms.md` drift**: Table says `@repo/utils` is used by “All apps”; marketing has no workspace deps on shared packages.
- **Convex env is intentionally separate**: `convex/lib/env.ts` (`requireEnv`) vs `packages/utils/src/env.ts` (`loadEnv`). Unifying by importing `@repo/utils` into Convex is **structurally risky** — that package has React peer deps and Zustand. Treat as three runtime layers (see Section 3), not a bug to merge blindly.

---

## 3. Configuration Management

### TypeScript

- Root `tsconfig.json` references six projects — correct composite/incremental setup.
- `tsconfig.base.json` centralizes strict options and `@repo/*` paths.
- Per-workspace overrides are appropriate: `convex/tsconfig.json` drops DOM/React; `apps/marketing` sets `allowImportingTsExtensions` locally (not in base).

**Package build pattern:** `utils` and `ui-web` use `composite: true`, `emitDeclarationOnly: true`, `outDir: dist/` for project references, while `package.json` `exports` still point at **`src/`** for runtime. Builds emit `.d.ts` for `tsc -b`, not shipped JS bundles.

### Environment Variables (Three Layers + File Locations)

| Layer          | Location                    | Role                                                              |
| -------------- | --------------------------- | ----------------------------------------------------------------- |
| Generic loader | `packages/utils/src/env.ts` | `loadEnv` + parsers (`asString`, etc.)                            |
| Web app        | `apps/web/src/env.ts`       | Schema + `import.meta.env` source; `loadWebEnv` / `requireWebEnv` |
| Convex server  | `convex/lib/env.ts`         | `requireEnv` for dashboard vars                                   |

**Env file templates** (structural, not just loaders):

| File                    | Scope                                      |
| ----------------------- | ------------------------------------------ |
| `.env.example` (root)   | Convex deployment, Clerk JWT for dashboard |
| `apps/web/.env.example` | `VITE_*` for the web app                   |

Adopters need a short map in `docs/setup.md` of which file to copy where.

**Strengths:** Separation matches runtimes (browser build vs Convex dashboard).

**Weaknesses:** `AGENTS.md` says never use `process.env` directly and points at `packages/utils/src/env.ts`, but Convex uses `requireEnv` — needs an explicit documented exception. Do **not** unify into `@repo/utils` without a server-safe extract (e.g. `packages/env-core` with no React/Zustand).

### Path Aliases — Duplication (Five Config Files)

| File                               | Aliases                                           |
| ---------------------------------- | ------------------------------------------------- |
| `tsconfig.base.json`               | `@repo/utils`, `@repo/ui-web`, `@repo/test-utils` |
| `apps/web/vite.config.ts`          | same three (with `dedupe`)                        |
| `apps/web/vitest.config.ts`        | same three (with `dedupe`)                        |
| `packages/ui-web/vitest.config.ts` | utils + test-utils (with `dedupe`)                |
| `packages/utils/vitest.config.ts`  | test-utils (with `dedupe`)                        |
| `convex/vitest.config.ts`          | none (no `dedupe` — no workspace deps)            |

Four of five Vite/Vitest configs include explicit `dedupe` fields (react, react-dom in web/ui-web/utils; zustand additionally deduped in web). Marketing and convex correctly have none.

Recommend a small shared alias source: `tsconfig.paths.json` for TypeScript extension and `packages/config/aliases.ts` (or JSON) for Vite/Vitest consumption. This keeps tool-specific formats explicit while reducing copy/paste drift.

### ESLint + Prettier

- Root flat config (`eslint.config.js`) applies repo-wide; root `"lint": "eslint ."` lints the **entire** monorepo.
- `convex/_generated/**` is ignored by ESLint (`globalIgnores`) and `.prettierignore` — **not** by `.gitignore`.

### `convex/_generated/` (Committed by Design)

- Five generated files are **committed** so clone → typecheck works without running `convex dev` first (`convex/README.md`).
- Trade-off: merge noise on CLI upgrades vs onboarding friction if gitignored.
- **Defer** gitignoring `_generated/` unless CI always runs codegen before typecheck.

### Package Manager + Lockfile

- `bun.lock`, `"packageManager"`, `.bun-version`, `.node-version` — reproducible toolchains.

### Root Scripts (Clarified)

| Script           | What it does                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lint`           | `eslint .` — full repo (root `eslint.config.js` is flat config, `globalIgnores` `_generated/`)                    |
| `typecheck`      | `tsc -p tsconfig.json --noEmit` — solution-wide check without emit (`tsconfig.json` extends `tsconfig.base.json`) |
| `typecheck:refs` | `tsc -b` — same graph as `build`, verify references only                                                          |
| `build`          | `tsc -b` — TS project references / declaration emit, **not** Vite/Astro production bundles                        |
| `test`           | Filters web, marketing, convex, ui-web, utils (not test-utils — no `test` script there)                           |

`README.md` (257 lines) has a **Core Commands** section documenting `lint`, `typecheck`, `build`, `test`, and `e2e:install` explicitly. Per-app production builds: `bun run --filter @repo/web build`, etc. (documented in README). Document in setup when to use `typecheck` vs `typecheck:refs` / `build`. Optional addition: `build:apps` script wrapping those filters.

**Maintainability hazard**: the root `test` script enumerates every workspace by name. Adding a new package silently excludes it from `bun test` at the root until the script is edited. Prefer a wildcard filter or a workspace-aware runner so test coverage is additive by default.

### Dependency `overrides` (Documented but Disconnected)

`docs/dependency-overrides.md` already has a **one-row-per-override table** with security/compatibility rationale. Gaps:

- Root `package.json` does not point reviewers at that doc (JSON has no comments; use README/setup link or a `//` note in a adjacent `overrides` section in docs only).
- **Version drift** between doc and pins (e.g. doc `ws` `^8.20.1` vs `package.json` `^8.21.0`; doc `yaml` `^2.8.3` vs `^2.9.0`). Treat the doc table as source of truth and sync on every override change.

### Dependabot vs Internal Semver

- **Dependabot** is configured (`.github/dependabot.yml`, grouped updates) — external dependency governance exists.
- **Changesets / internal semver** for `@repo/*` is not present; `workspace:*` is normal for a private starter monorepo.

---

## 4. Build, Test, and CI

### Testing Stratification

| Layer  | Tool          | Scope                  |
| ------ | ------------- | ---------------------- |
| Unit   | Vitest        | packages, apps, convex |
| E2E    | Playwright    | web, marketing         |
| Convex | `convex-test` | `convex/tasks.test.ts` |

Co-located `*.test.ts` beside source across workspaces.

### `packages/test-utils`

- No `build` script; exports point at `src/`.
- In `tsconfig.json` references but omitted from root `test` (only `typecheck` — no test runner script).
- Minor inconsistency with `utils` / `ui-web` `build` scripts, but those builds are **declaration-only** — not a production-runtime gap for test-utils.
- Add `build` + composite only if test-utils joins the `tsc -b` reference graph with the same pattern.

### CI/CD

- `ci.yml`: change detection fans out `apps/web/*`, `apps/marketing/*`, `convex/*`, `packages/*`; shared/config changes trigger all platforms.
- `deploy.yml`: release tags `{web,marketing,convex}-v{version}`.
- Workflow-level `NODE_VERSION` / `CONVEX_CI_TESTS` are hardcoded — acceptable; parameterize only if multi-environment matrices are needed.

---

## 5. Maintainability Conventions

### Maintainability strengths

1. **Workspace isolation** — per-package `package.json`, `tsconfig.json`, scripts.
2. **`@repo/*` path aliases** — consistent imports (when configs stay in sync).
3. **Verify gate** — `AGENTS.md` / README: `bun run lint && bun run typecheck && bun run test`.
4. **ADRs** — `docs/adr/` for structural decisions.
5. **Husky + lint-staged** — staged-file quality at commit; CI enforces full repo.
6. **Dependabot groups** — consolidated dependency PRs.
7. **Security/docs** — `SECURITY.md`, `docs/security-headers.md`, `docs/dependency-overrides.md`, root `overrides`, Vercel monorepo build commands.

### Maintainability weaknesses

1. **`@repo/utils` single export** — barrel re-exports ~30 symbols across five domains; prefer **subpath exports** before splitting packages.
2. **Env convention gap** — three layers and two `.env.example` files exist; `AGENTS.md` / setup should document Convex `requireEnv` and file locations as intentional.
3. **Alias drift risk** — five config files must be updated together when adding a package.
4. **`docs/platforms.md`** — incorrectly implies marketing uses `@repo/utils`.
5. **Starter growth thresholds** — `apps/web/src/` and `convex/tasks.ts` are appropriately small, but adopters need guidance for when to introduce feature folders and model layers.
6. **AI guidance fragmentation** — `AGENTS.md`, `.github/copilot-instructions.md`, `prompts/`, `docs/` with no index of precedence.
7. **`overrides` maintenance** — policy is documented but easy to desync from `package.json` without a linked checklist in setup or PR template.

---

## 6. Convex Internal Structure

Convex recommends thin function files and a `convex/model/` layer for business logic reusable across queries, mutations, and crons.

### Current

```text
convex/
├── schema.ts
├── tasks.ts       # CRUD + getOwnedTask in handlers (~140 lines)
├── lib/
│   ├── env.ts
│   ├── validation.ts
│   └── auth.ts
├── _generated/    # Committed for offline typecheck
├── tasks.test.ts
└── test.setup.ts
```

### When to Adopt `model/`

Fine at starter scale. Introduce `convex/model/tasks.ts` when handlers exceed ~200 lines, logic is shared with crons/internal actions, or you want plain-TS unit tests without full `convex-test` fixtures.

### Starter Growth Thresholds

The current mostly-flat starter layout is a strength because it is easy to scan. Add structure when the product earns it:

- Introduce `apps/web/src/components/` when multiple app-local components are reused outside `App.tsx`.
- Introduce `apps/web/src/features/<domain>/` when a domain owns UI, hooks, local helpers, tests, and copy together.
- Introduce `convex/model/<domain>.ts` when query/mutation handlers start sharing business rules or when logic needs direct unit tests without full backend fixtures.

---

## 7. Actionable Improvements (Prioritized)

| Priority     | Change                                                                                                                                                                  | Rationale                                                                                | Effort |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| **P0**       | Add `@repo/utils` **subpath exports** in `package.json` (e.g. `./env`, `./theme`, `./i18n`, `./storage`, `.` for `cn`)                                                  | Matches existing `src/` split; clearer imports; less fork churn than new packages        | Low    |
| **P0**       | Document **three env layers** + **env file map** in `docs/setup.md` and `AGENTS.md` (app `loadEnv` + Vite source, Convex `requireEnv`, root vs `apps/web/.env.example`) | Aligns conventions with code; avoids unsafe Convex → `@repo/utils` dependency            | Low    |
| **P0**       | Replace enumerated filters in root `"test"` with a wildcard (`bun run --filter '*' test`) or workspace-aware runner                                                     | Adding a package no longer silently drops it from root `bun test`                        | Low    |
| **P1**       | Add `tsconfig.paths.json` plus `packages/config/aliases.ts` (or JSON) shared by Vite and Vitest                                                                         | Eliminates multi-config alias drift while preserving tool-specific formats               | Low    |
| **P1**       | Link `package.json` `overrides` to `docs/dependency-overrides.md` in README/setup; **keep doc versions in sync** with pins on change                                    | Policy is documented; fix discoverability and drift                                      | Low    |
| **P1**       | Add **`docs/monorepo-structure.md`** (or extend `platforms.md`): env layers, env files, alias source, `typecheck` vs `build`, release tags, growth thresholds           | Consolidates structural docs without repurposing the business `architecture.md` template | Low    |
| **P1**       | Fix `docs/platforms.md` — marketing does not consume `@repo/utils`                                                                                                      | Docs match isolation boundary                                                            | Low    |
| **P1**       | Optional root `build:apps`: `bun run --filter '@repo/web' --filter '@repo/marketing' build`                                                                             | Clarifies `tsc -b` vs production artifacts without changing default `build`              | Low    |
| **P2**       | Document starter growth thresholds (in monorepo-structure doc or setup)                                                                                                 | Keeps the starter flat while giving forks a clear web/Convex scaling path                | Low    |
| **P2**       | Document the `apps/web/src/` target shape using `apps/marketing/src/`’s nesting as the reference                                                                        | Removes web↔marketing organizational asymmetry once `web` grows                          | Low    |
| **P2**       | Add an authoring rule (ADR or package README) for `utils` vs `ui-web` vs future packages                                                                                | Prevents barrel sprawl after subpath exports land                                        | Low    |
| **P2**       | Add `docs/agent-guidance.md` — index: AGENTS.md → Copilot mirror → prompts/ → ADRs                                                                                      | Reduces ambiguity for humans and agents                                                  | Low    |
| **P2**       | Adopt `convex/model/` when task logic grows or is reused by crons                                                                                                       | Convex layering best practice                                                            | Medium |
| **P2**       | Consider Changesets if publishing packages or needing internal semver changelog                                                                                         | Dependabot already covers external deps                                                  | Medium |
| **Defer**    | Split `@repo/utils` into multiple packages                                                                                                                              | High churn; subpaths first                                                               | Medium |
| **Defer**    | Gitignore `convex/_generated/`                                                                                                                                          | Conflicts with starter “typecheck without `convex dev`” goal                             | Low    |
| **Defer**    | Unify Convex env into `@repo/utils`                                                                                                                                     | React/Zustand in utils; needs `env-core` extract first                                   | Medium |
| **Optional** | Move `prompts/` → `.github/prompts/`                                                                                                                                    | Cleaner root; update README links                                                        | Low    |

---

## 8. Corrections From Review Passes

Items corrected after deeper repo verification (including second independent pass):

| Initial claim                                      | Actual state                                                                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.gitignore` excludes `convex/_generated/**`       | **Incorrect.** Only ESLint and Prettier ignore it; files are committed intentionally.                                                       |
| Root has no `lint`                                 | **Incorrect.** Root `"lint": "eslint ."` covers the full repo.                                                                              |
| Root has no `build`                                | **Partially incorrect.** Root `"build": "tsc -b"` exists for TS composites; app bundles use `--filter` (documented in README).              |
| P0: Unify Convex env via `@repo/utils/loadEnv()`   | **Risky** without a server-safe package; document three layers instead.                                                                     |
| P0: Split utils into four sub-packages             | **Heavy** for a starter; prefer subpath exports first.                                                                                      |
| P2: Stop committing `_generated/`                  | **Conflicts** with documented onboarding (`convex/README.md`).                                                                              |
| No dependency versioning strategy                  | **Overstated.** Dependabot v2 with groups exists; missing piece is Changesets/internal semver.                                              |
| Alias duplication only in `vite.config.ts`         | **Undercounted.** Also duplicated in web/ui-web/utils Vitest configs.                                                                       |
| `test-utils` missing build breaks production use   | **Overstated** given `emitDeclarationOnly` + `src` export pattern across packages.                                                          |
| Root `overrides` are fully unannotated             | **Overstated.** `docs/dependency-overrides.md` has a rationale table; issue is **linkage + version sync**, not missing docs.                |
| Promote `docs/architecture.md` as structural index | **Misaligned.** That file is an intentional **business-architecture** template; use `docs/monorepo-structure.md` or `platforms.md` instead. |
| `apps/web/src/` is fully flat                      | **Mostly true.** `locales/` is already grouped; no `components/` or `features/` yet.                                                        |

### Additional Findings

- **`apps/web/src/env.ts`** — positive app-boundary pattern for env schemas.
- **`emitDeclarationOnly` + `src` exports** — explains package `build` vs runtime consumption.
- **Five-file path alias duplication** — not two-way (TS + Vite only); marketing correctly omits aliases; 4 of 5 Vite configs explicitly list `dedupe` (react, react-dom, zustand).
- **Starter growth thresholds** — mostly-flat `apps/web/src/` and handler-local Convex logic are fine now; forks need clear triggers for feature/model layers.
- **AI guidance** split across four locations without a single index.
- **Root `test` script enumerates workspaces by name** — silent omission risk when adding a package.
- **`overrides` doc drift** — e.g. `ws` and `yaml` versions in `docs/dependency-overrides.md` lag `package.json` pins.
- **Apps directory organizational asymmetry** — marketing nests by concern; web is mostly flat with `locales/` as the only subfolder.
- **No package-boundary authoring rule** — subpath exports help today’s barrel; nothing prevents tomorrow’s sprawl.
- **Dual typecheck entry points** — `typecheck`, `typecheck:refs`, and `build` (`tsc -b`) are easy to confuse without a one-line guide in setup.
- **Multi-file env templates** — root `.env.example` vs `apps/web/.env.example` need an explicit map for adopters.
- **`README.md` (257 lines)** has a comprehensive **Documentation** section (cross-references 8 docs files) + **Core Commands** table; deploy/CI links properly in platform-status table.
- **`prompts/` has 11 specific templates** (accessibility, arch-decision, bug-fix, code-review, documentation, feature-dev, performance, README, refactor, security, testing) — all README-linked; references AGENTS.md.
- **`.github/`** contains `copilot-instructions.md` (mirrors AGENTS.md for Copilot), `dependabot.yml` (grouped updates), PR template, `release.yml`, and `workflows/` directory — all referenced in README.
- **`packages/ui-web/src/index.ts`** exports 5 components (Button, ErrorBoundary, LanguageSwitcher, SubmitButton, ThemeToggle) with type re-exports — clean consumer API but still a barrel.
