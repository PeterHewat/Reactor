# ADR-002: Package boundary authoring

## Status

Accepted — 2026-05-26

## Context

`@repo/utils` groups several concerns behind one barrel export. Subpath exports reduce import noise, but without rules new code tends to expand the barrel or place UI in the wrong package.

## Decision

| Package            | Belongs here                                                                                        | Does not belong here                                                |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `@repo/utils`      | `cn`, env loaders/parsers, theme/i18n stores, storage helpers, framework-agnostic hooks             | React components, route-specific copy, Convex/server-only env       |
| `@repo/ui-web`     | Reusable React UI primitives consumed by `apps/web`                                                 | App-specific pages, marketing `.astro` components, business logic   |
| `@repo/test-utils` | Shared Vitest mocks/fixtures (`/convex-react-setup` for web)                                        | Production runtime code                                             |
| `@repo/env-core`   | Framework-agnostic `loadEnv` (no React/Zustand)                                                     | Convex runtime; prefer `@repo/utils/env` only when already on utils |
| `convex/lib/`      | Server auth, validation, `requireEnv`                                                               | Anything importing `@repo/utils` (React/Zustand peers)              |
| New package        | Extract when a concern is reused across **two+** apps/packages **and** does not fit the table above | Premature splits before reuse is clear                              |

Prefer **subpath imports** (`@repo/utils/env`) over growing the root barrel. Prefer a new package only when subpaths are insufficient (e.g. server-safe env core with zero UI deps).

## Consequences

- Positive: Clear home for new shared code; avoids Convex → utils dependency mistakes.
- Positive: Marketing stays isolated from workspace React packages.
- Negative: Authors must read this ADR or package READMEs before adding exports.
