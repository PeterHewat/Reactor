# ADR-003: Bun-native monorepo tasks and CI (no Turborepo/Nx)

## Status

Accepted — 2026-06-01

## Context

This repository is a **small Bun workspace monorepo** (two apps, several packages, Convex at repo root) meant to be **forked once** and grown by adopters. Task running today relies on:

- Root and workspace `package.json` scripts
- `bun run --filter <workspace> <script>`
- TypeScript project references (`tsc -b`, solution `typecheck`)
- GitHub Actions with **path-based change detection** and **per-job** `bun install --frozen-lockfile`

Teams scaling monorepos often adopt **Turborepo** (pipeline + remote cache) or **Nx** (project graph, generators, boundary rules). Both add concepts, config surface, and CI entrypoints that compete with the template’s goal: stay Bun-centric and easy to understand on day one.

## Decision

**Do not** adopt Turborepo, Nx, or similar monorepo orchestrators in this template.

**Do** invest in Bun-native orchestration and CI efficiency:

| Area                   | Approach                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local tasks            | Root scripts (`dev`, `generate`, `test`, `lint`, …) and `bun run --filter @repo/*`                                                                                                        |
| TypeScript build graph | `tsconfig.json` references + `tsc -b` / `typecheck` (see [monorepo-structure.md](../monorepo-structure.md#typecheck-vs-build))                                                            |
| Affected work in CI    | Maintain explicit path rules in [ci.yml](../../.github/workflows/ci.yml) (apps, `convex/`, shared packages, root config); extend when new shared packages appear (e.g. `packages/tokens`) |
| CI install time        | `.github/actions/setup-bun` caches `node_modules` + Bun install cache keyed on `bun.lock` + `.bun-version`                                                                                |
| Boundaries             | Document in [ADR-002](./002-package-boundary-authoring.md); enforce with ESLint/import rules as the repo matures—not via Nx module boundaries                                             |
| Per-surface tests      | Prefer explicit scripts (`test:web`, package-level `test`) over a single growing `bun run --filter '*' test` as workspaces multiply                                                       |

Adopters may add Turborepo or Nx in their fork; supersede this ADR if they do.

### Alternatives considered

| Option        | Why not default here                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Turborepo** | Strong remote caching and pipelines, but another config layer and cache-correctness burden for a starter; overlaps with existing scripts     |
| **Nx**        | Rich graph, generators, and boundary enforcement—high adoption cost and opinionated structure for a template with intentional minimal layout |

## Consequences

### Positive

- Lower onboarding: no orchestrator concepts before Convex, Clerk, and env wiring
- Single package manager story (Bun workspaces + filters)
- CI and local commands stay readable in `package.json` and workflow YAML
- Forks are not locked into Vercel/Nx Cloud–centric caching unless they choose it

### Negative

- **Manual CI maintenance** when adding workspaces or shared packages (path filters must be updated)
- **No remote task cache** across machines/CI by default—must implement GitHub Actions caching and disciplined scripts
- **Affected detection** is coarser than a full project graph until path rules are improved
- **Boundary enforcement** remains documentation + lint unless adopters add tooling

### Revisit this decision when

- Workspace count or CI wall-clock time grows enough that install + test duplication dominates (e.g. routinely many minutes on every PR)
- Path-based `detect-changes` repeatedly misses rebuilds or runs too much
- The team needs **enforced** module boundaries beyond ADR-002 and ESLint
- Multiple developers ask for **remote caching** or **affected** commands as the primary dev/CI interface

Then evaluate Turborepo (caching + pipelines) or Nx (graph + boundaries)—or keep Bun-native and extend path rules, composite actions, and install caching in [ci-cd.md](../ci-cd.md) and [ci.yml](../../.github/workflows/ci.yml).

## Related

- [ci-cd.md](../ci-cd.md) — workflows, secrets, PR labels
- [monorepo-structure.md](../monorepo-structure.md) — layout, `tsc -b`, root `test`
