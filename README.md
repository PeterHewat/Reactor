# Reactor

Multi-platform starter monorepo for Web (React 19), Mobile (React Native), and Marketing (Astro) with Convex backend and Clerk authentication.

## Tech Stack

### Applications

- **Web App**: React 19 + Vite + Tailwind CSS v4 + Zustand (`apps/web/`)
- **Mobile App**: React Native CLI + NativeWind (`apps/mobile/`)
- **Marketing Site**: Astro + Tailwind CSS (`apps/marketing/`)

### Backend

- **Database & API**: Convex (`convex/`)
- **Authentication**: Clerk

### State Management

- **Server State**: Convex (useQuery, useMutation)
- **Global UI State**: Zustand (theme, i18n, complex UI state)
- **Local UI State**: React useState

### Shared Packages

- **UI Web**: Web components with shadcn/ui patterns (`packages/ui-web/`)
- **UI Mobile**: React Native components (`packages/ui-mobile/`)
- **UI Marketing**: Astro component utilities (`packages/ui-marketing/`)
- **UI Shared**: Design tokens and TypeScript interfaces (`packages/ui-shared/`)
- **Utils**: Common helpers (cn, theme, i18n) (`packages/utils/`)
- **Test Utils**: Testing utilities and mocks (`packages/test-utils/`)

### Testing

- **Unit Tests**: Vitest
- **E2E Tests (Web)**: Playwright
- **E2E Tests (Mobile)**: Detox (after setup)

## Quick Start

### Prerequisites

Install the following software:

- [git-scm](https://git-scm.com/download/)
- [Node.js](https://nodejs.org/en/) (v24.0.0 or higher)

Check that tools are available on PATH:

```bash
node -v
npm -v
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
cd reactor
npm run clean-install
```

Then follow [docs/setup.md](docs/setup.md) to scaffold your platforms:

- **Web App**: Ready to use, just configure Convex and Clerk
- **Mobile App**: Follow `apps/mobile/README.md` to initialize React Native
- **Marketing Site**: Ready to use, just configure your domain and content.

## Project Structure

```text
apps/
  web/                    # React 19 web application
  mobile/                 # React Native mobile app
  marketing/              # Astro marketing site

packages/
  ui-web/                 # Web UI components (shadcn/Tailwind)
  ui-mobile/              # Mobile UI components (NativeWind)
  ui-marketing/           # Marketing components (Astro utilities)
  ui-shared/              # Design tokens and shared types
  utils/                  # Platform-agnostic utilities
  test-utils/             # Testing utilities

convex/                   # Backend schema & functions
docs/                     # Documentation
prompts/                  # AI prompt templates
```

## Documentation

- **[Setup Guide](docs/setup.md)** - Initial project scaffolding and configuration
- **[Architecture](docs/architecture.md)** - System design and technical decisions
- **[Multi-Platform Architecture](docs/web+mobile+marketing.md)** - Platform strategy and package responsibilities
- **[Product Requirements](docs/product.md)** - Business requirements and user stories
- **[Architecture Decisions](docs/adr/)** - Record of architectural decision records
- **[AI Prompt Templates](prompts/)** - Standardized prompts for development workflows

## Core Commands

```bash
# Quality checks
npm run lint           # Lint all packages
npm run format         # Check formatting (Prettier)
npm run format:fix     # Fix formatting
npm run typecheck      # Type check all packages
npm run typecheck:refs # Type check with project references

# Build & clean
npm run build          # Build all TypeScript projects
npm run clean          # Clean TypeScript build artifacts

# Testing
npm test               # Run all unit tests
npm run e2e:install    # Install Playwright browsers (one-time)

# Dependencies
npm run install        # Install dependencies (ignore scripts)
npm run clean-install  # Clean install (npm ci, ignore scripts)
npm run outdated       # Check for outdated dependencies
npm run update         # Update dependencies within semver ranges
```

### Platform-Specific Commands

```bash
# Web app
npm run -w apps/web dev           # Start dev server
npm run -w apps/web build         # Production build
npm run -w apps/web e2e           # Run Playwright tests

# Mobile app (after React Native setup)
npm run -w apps/mobile start      # Start Metro bundler
npm run -w apps/mobile ios        # Run on iOS
npm run -w apps/mobile android    # Run on Android

# Marketing site (after Astro setup)
npm run -w apps/marketing dev     # Start dev server
npm run -w apps/marketing build   # Production build
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

- Check updates: `npm run outdated`
- Update within declared semver ranges: `npm run update`
- Semver reminder:
  - `*` latest stable
  - `^` update minor
  - `~` update patch
  - pinned version = no updates

To update outside ranges, edit `package.json` versions, then run `npm update`.

### E2E Tests (Playwright)

- **Install Browsers (once):** `npm run e2e:install` (runs Playwright install in `apps/web`)
- **Run tests locally:** `npm run -w apps/web e2e`
- **CI (opt-in on PRs):** Add the `e2e` label to your Pull Request to run Playwright tests in CI. E2E only runs when frontend changes are detected and the label is present
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

- **CI (Push/PR to main):** Runs in [ci.yml](.github/workflows/ci.yml). Detects changes in web, mobile, marketing, and convex. For changed areas, executes lint, format, typecheck, and tests
- **CD (Release published):** Runs in [cd.yml](.github/workflows/cd.yml). Parses tags `web-vX.Y.Z`, `mobile-vX.Y.Z`, `marketing-vX.Y.Z`, or `convex-vX.Y.Z` and performs deployment for the targeted platform
- **Release Planning (Manual):** [release.yml](.github/workflows/release.yml) analyzes changes for each platform, increments versions per selection (patch/minor/major), and creates GitHub releases
