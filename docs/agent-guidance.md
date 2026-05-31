# Agent and contributor guidance index

Where to look for conventions, in order of precedence for **this repo**:

1. **[AGENTS.md](../AGENTS.md)** — Canonical tool-first rules (Cursor, GitHub Copilot in VS Code/GitHub via `AGENTS.md`, verify gate, env, Convex, Tailwind).
2. **[CLAUDE.md](../CLAUDE.md)** — Same rules as AGENTS.md for Claude Code; keep both in sync. `bun run generate:ai` only replaces the marked Convex section at the bottom.
3. **[prompts/](../prompts/)** — Task-specific prompt templates (code review, testing, security, etc.); see [prompts/README.md](../prompts/README.md).
4. **[docs/spec/](./spec/)** — Feature matrix and per-phase implementation specs (acceptance criteria, permissions, routes/APIs).
5. **[docs/adr/](./adr/)** — Accepted architectural decisions (backend choice, package boundaries).
6. **[docs/monorepo-structure.md](./monorepo-structure.md)** — Layout, env layers, aliases, typecheck vs build, growth thresholds.
7. **[docs/ci-cd.md](./ci-cd.md)** — Workflows, secrets, releases, PR labels.
8. **[docs/development.md](./development.md)** — Development reference (Tailwind, E2E, Convex test patterns).
9. **[docs/platforms.md](./platforms.md)** — Surfaces, stack, packages, data flow.
10. **[docs/getting-started.md](./getting-started.md)** — Optional human onboarding runbook and commands (adopters may delete it; use [README.md](../README.md) if absent).

Human-oriented docs (product, business architecture template, CI/CD secrets) live under `docs/`, [README.md](../README.md), and [CONTRIBUTING.md](../CONTRIBUTING.md); they do not override AGENTS.md for automated agents.

When AGENTS.md and development.md disagree on env access, follow the **three-layer env model** in [monorepo-structure.md](./monorepo-structure.md#environment-variables-three-layers): app `loadEnv` + Vite source, Convex `requireEnv`, never raw `process.env` in app code.
