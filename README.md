# Reactor

Starter monorepo for Web (React 19), Marketing (Astro), Convex backend, and Clerk authentication.

[![CI](https://img.shields.io/github/actions/workflow/status/PeterHewat/Reactor/ci.yml?branch=main)](https://github.com/PeterHewat/Reactor/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/Bun-000?style=flat&logo=bun&logoColor=fff)](https://bun.sh/)
[![Convex](https://img.shields.io/badge/Convex-EE342F?logo=convex&logoColor=fff)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-835FFF?logo=clerk&logoColor=fff)](https://clerk.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=fff)](https://astro.build/)

## Quick start (copy-paste)

```bash
git clone git@github.com:PeterHewat/Reactor.git
cd Reactor
bun install
bun run dev
```

| Resource                             | Purpose                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)               | Rules for AI agents (verify: `bun run lint && bun run typecheck && bun run test`) |
| [docs/setup.md](docs/setup.md)       | First-time platform setup, local dev, Convex/Clerk wiring                         |
| [docs/ci-cd.md](docs/ci-cd.md)       | CI jobs, GitHub secrets, releases, PR previews (`e2e` / `preview` labels)         |
| [convex/README.md](convex/README.md) | Link your Convex project, enable backend in web                                   |

Backend (when ready): `cp apps/web/.env.example apps/web/.env.local` → `bunx convex dev` → wire providers per `convex/README.md`.

## Platform status

| Platform  | Code status | CI tests               | CD                               |
| --------- | ----------- | ---------------------- | -------------------------------- |
| Web       | Ready       | Vitest + Playwright    | Vercel on `web-v*` release       |
| Marketing | Ready       | Vitest + Playwright    | Vercel on `marketing-v*` release |
| Convex    | Scaffold    | Vitest (`convex-test`) | Deploy on `convex-v*` release    |

**Scaffold** = sample backend in repo; link your Convex project with `bunx convex dev`. **Ready** = dev server and tests run from the repo as-is. Adopters use **Clerk + Convex + Vercel** (web and marketing); this template repo has no live accounts linked.

See [docs/ci-cd.md](docs/ci-cd.md#ci-and-test-jobs) for workflows and opt-in PR labels (`e2e`, `preview`).

## Tech Stack

### Applications

- **Web App**: React 19 + Vite 8 + Tailwind CSS v4 + Zustand (`apps/web/`)
- **Marketing Site**: Astro 6 + Vite 7 + Tailwind CSS v4 (`apps/marketing/`)

### Backend

- **Database & API**: Convex (`convex/`)
- **Authentication**: Clerk

### State Management

- **Server State**: Convex (useQuery, useMutation)
- **Global UI State**: Zustand (theme, i18n, complex UI state)
- **Local UI State**: React useState

### Shared Packages

- **UI Web**: Web components with shadcn/ui patterns (`packages/ui-web/`)
- **Utils**: Common helpers (cn, theme, i18n) (`packages/utils/`)
- **Test Utils**: Testing utilities and mocks (`packages/test-utils/`)

### Testing

- **Unit Tests**: Vitest
- **E2E Tests**: Playwright (web + marketing)

### Prerequisites

Install the following software:

- [git-scm](https://git-scm.com/download/)
- [Bun](https://bun.sh/) (latest version)

Check that tools are available on PATH:

```bash
bun --version   # >= 1.3.13 (.bun-version)
node --version  # >= 22.12 for marketing (Astro 6)
```

Recommended IDEs:

- [VS Code](https://code.visualstudio.com/) with [Copilot](https://github.com/features/copilot), [KiloCode](https://kilocode.com/), [Cline](https://cline.bot/) or other AI coding assistants
- [Cursor](https://cursor.com/)
- [Claude Code](https://claude.com/product/claude-code)

### Setup Steps

The repo provides structure, tooling, and guidance while keeping you in control.

Clone the repository and install dependencies

```bash
git clone git@github.com:PeterHewat/Reactor.git
cd Reactor
bun install
```

Then follow [docs/setup.md](docs/setup.md) to scaffold your platforms:

- **Web**: Ready — `bun run --filter @repo/web dev` without backend; link Convex/Clerk when you need them
- **Marketing**: Ready — `bun run --filter @repo/marketing dev` (content and deploy config are yours)

## Project Structure

```text
apps/
  web/                    # React 19 web application
  marketing/              # Astro marketing site

packages/
  ui-web/                 # Web UI components (shadcn/Tailwind)
  utils/                  # Platform-agnostic utilities
  test-utils/             # Testing utilities

convex/                   # Backend schema & functions
docs/                     # Documentation
prompts/                  # AI prompt templates
```

## Documentation

- **[Setup Guide](docs/setup.md)** - First-time scaffolding and local configuration
- **[CI/CD](docs/ci-cd.md)** - Workflows, secrets, releases, PR previews
- **[Security](SECURITY.md)** - Reporting vulnerabilities and secret handling
- **[Security headers / CSP](docs/security-headers.md)** - Examples for Vite, Vercel, Netlify, Cloudflare
- **[Architecture](docs/architecture.md)** - System design and technical decisions
- **[Platform architecture](docs/platforms.md)** - Apps, packages, and CI expectations
- **[Product Requirements](docs/product.md)** - Business requirements and user stories
- **[Architecture Decisions](docs/adr/)** - Record of architectural decision records
- **[AI Prompt Templates](prompts/)** - Standardized prompts for development workflows

## Core Commands

```bash
# Quality checks
bun run lint           # Lint all packages
bun run format         # Check formatting (Prettier)
bun run format:fix     # Fix formatting
bun run typecheck      # Type check all packages
bun run typecheck:refs # Type check with project references

# Build & clean
bun run build          # Build all TypeScript projects
bun run clean          # Clean TypeScript build artifacts

# Testing
bun run test           # Run all unit tests
bun run e2e:install    # Install Playwright browsers (one-time)

# Dependencies
bun install            # Install dependencies
bun run clean-install  # Clean install
bun run outdated       # Check for outdated dependencies
bun run update         # Update dependencies within semver ranges
```

### Platform-Specific Commands

```bash
# Web app
bun run --filter @repo/web dev           # Start dev server
bun run --filter @repo/web build         # Production build
bun run --filter @repo/web e2e           # Run Playwright tests

# Marketing site
bun run --filter @repo/marketing dev     # Start dev server
bun run --filter @repo/marketing build   # Production build
```

## Development Workflow

### Branching & PR Workflow

- `main` holds the latest stable code and should be protected
- Create feature branches from `main` (e.g., `feature/short-description`)
- Open a Pull Request; CI must pass and a reviewer should approve
- Use squash merge; ensure the squash commit message is clear and references the work item if applicable

### Commit Message Guidelines

- Separate subject from body with a blank line
- Limit the subject line to 50 characters
- Capitalize the subject line
- Do not end the subject line with a period
- Use the imperative mood in the subject line
- Wrap the body at 72 characters
- Use the body to explain what and why vs. how

Reference: [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

### Dependencies & Semver

- Check updates: `bun run outdated`
- Update within declared semver ranges: `bun run update`
- Semver reminder:
  - `*` latest stable
  - `^` update minor
  - `~` update patch
  - pinned version = no updates

To update outside ranges, edit `package.json` versions, then run `bun update`.

### TypeScript version policy

- **Root and apps** use `typescript: "~6.0.3"` — patch updates within 6.0.x only (`bun run update` will not jump to 6.1).
- Do not mix `^6.0.3` in workspaces unless you intentionally want minor bumps; keep versions aligned with the root pin.
- Bump TypeScript deliberately: edit `~6.0.3` in root `package.json` and workspace packages together, then `bun install`.

### E2E Tests (Playwright)

- **Install Browsers (once):** `bun run e2e:install` (runs Playwright install in `apps/web`)
- **Run tests locally:** `bun run --filter @repo/web e2e`
- **CI (opt-in on PRs):** Add the `e2e` label to your Pull Request to run Playwright tests in CI. E2E only runs when frontend changes are detected and the label is present
- **Preview deploys (opt-in on PRs):** Add the `preview` label for Convex + Vercel preview URLs ([preview.yml](.github/workflows/preview.yml), [ci-cd](docs/ci-cd.md#pr-preview-deployments))
- **Naming convention:** Playwright looks for `*.e2e.ts` files

### AI Development Tools

**Chrome DevTools MCP Integration**
Enable AI-assisted browser automation and testing directly from VS Code:

```bash
code --add-mcp '{"name":"chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp@latest"]}'
```

This provides AI assistants with the ability to:

- Navigate web pages and interact with DOM elements
- Take screenshots and inspect page content
- Debug web applications through Chrome DevTools
- Test web applications by simulating user interactions
- Analyze performance, network requests, and console logs

Useful for E2E test development, debugging, and automated browser testing workflows.

### CI/CD Overview

- **CI (Push/PR to main):** Runs in [ci.yml](.github/workflows/ci.yml). Detects changes in web, marketing, and convex. For changed areas, executes lint, format, typecheck, and tests
- **CD (Release published):** Runs in [cd.yml](.github/workflows/cd.yml). Parses tags `web-vX.Y.Z`, `marketing-vX.Y.Z`, or `convex-vX.Y.Z` and performs deployment for the targeted platform
- **Release Planning (Manual):** [release.yml](.github/workflows/release.yml) analyzes changes for each platform, increments versions per selection (patch/minor/major), and creates GitHub releases
