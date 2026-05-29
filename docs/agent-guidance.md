# Agent and contributor guidance index

Where to look for conventions, in order of precedence for **this repo**:

1. **[AGENTS.md](../AGENTS.md)** — Tool-first rules, verify gate (`lint && typecheck && test`), project conventions (env, Convex, Tailwind).
2. **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** — GitHub Copilot mirror of AGENTS.md (keep in sync when changing agent rules).
3. **[prompts/](../prompts/)** — Task-specific prompt templates (code review, testing, security, etc.); see [prompts/README.md](../prompts/README.md).
4. **[docs/spec/](./spec/)** — Feature matrix and per-phase implementation specs (acceptance criteria, permissions, routes/APIs).
5. **[docs/adr/](./adr/)** — Accepted architectural decisions (backend choice, package boundaries).
6. **[docs/monorepo-structure.md](./monorepo-structure.md)** — Layout, env layers, aliases, typecheck vs build, growth thresholds.
7. **[docs/setup.md](./setup.md)** — First-time scaffolding and platform setup.
8. **[docs/platforms.md](./platforms.md)** — Apps, shared packages, CI expectations.

Human-oriented docs (product, business architecture template, CI/CD secrets) live under `docs/` and [README.md](../README.md#documentation); they do not override AGENTS.md for automated agents.

When AGENTS.md and setup disagree on env access, follow the **three-layer env model** in [monorepo-structure.md](./monorepo-structure.md#environment-variables-three-layers): app `loadEnv` + Vite source, Convex `requireEnv`, never raw `process.env` in app code.
