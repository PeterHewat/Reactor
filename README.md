# Reactor

[![CI](https://img.shields.io/github/actions/workflow/status/PeterHewat/Reactor/ci.yml?branch=main)](https://github.com/PeterHewat/Reactor/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/Bun-000?style=flat&logo=bun&logoColor=fff)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=fff)](https://astro.build/)
[![Convex](https://img.shields.io/badge/Convex-EE342F?logo=convex&logoColor=fff)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-835FFF?logo=clerk&logoColor=fff)](https://clerk.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Reactor** is a production-shaped **Bun monorepo template** for teams shipping a **product web app** (React), a **marketing site** (Astro), and a **Convex + Clerk** backend—with shared packages, per-surface CI/CD, and agent-first conventions (`AGENTS.md`).

[**Use this template**](https://github.com/PeterHewat/Reactor/generate) to create your repository—replace the sample **tasks** slice with your product while keeping env wiring, monorepo layout, and deploy tags. It is **not** a deployable SaaS out of the box.

**Good fit:** product + marketing + realtime backend, Vercel deploys, AI-assisted development.

## Resources

| Resource                                                 | Purpose                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [docs/getting-started.md](docs/getting-started.md)       | **Start here** — local setup through production checklist |
| [docs/development.md](docs/development.md)               | Day-to-day patterns and commands                          |
| [docs/development.md](docs/development.md)               | Tailwind, E2E, Convex test patterns                       |
| [docs/platforms.md](docs/platforms.md)                   | Surfaces, stack, packages, data flow                      |
| [docs/monorepo-structure.md](docs/monorepo-structure.md) | Layout, env layers, aliases, codegen                      |
| [docs/ci-cd.md](docs/ci-cd.md)                           | Workflows, secrets, releases, PR labels                   |
| [docs/architecture.md](docs/architecture.md)             | Business architecture template (replace after clone)      |
| [docs/agent-guidance.md](docs/agent-guidance.md)         | Doc precedence for agents                                 |
| [AGENTS.md](AGENTS.md)                                   | Rules for coding agents                                   |
| [CONTRIBUTING.md](CONTRIBUTING.md)                       | Branches, commits, hooks, dependency policy               |
| [convex/README.md](convex/README.md)                     | Convex auth, env, file layout                             |
| [SECURITY.md](SECURITY.md)                               | Vulnerability reporting                                   |
| [docs/security-headers.md](docs/security-headers.md)     | CSP examples (Vite, Vercel, etc.)                         |
| [docs/product.md](docs/product.md)                       | Product requirements template                             |
| [docs/adr/](docs/adr/)                                   | Architecture decision records                             |
| [prompts/](prompts/)                                     | AI prompt templates                                       |
