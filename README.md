# Reactor

Starter monorepo for React 19, Convex, Clerk, Tailwind CSS, Vitest, and Playwright.

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS (`apps/web/`)
- **Backend**: Convex + Clerk auth (`convex/`)
- **Shared UI**: Tailwind/shadcn components (`packages/ui/`)
- **Shared Utils**: Common helpers including `cn()` (`packages/utils/`)
- **Testing**: Vitest (unit), Playwright (e2e)

## Quick Start

### Prerequisites

Install the following software:

- [git-scm](https://git-scm.com/download/)
- [Node.js](https://nodejs.org/en/) (v24.13.0 or higher)

Check that tools are available on PATH:

```bash
node -v
npm -v
```

Recommended IDEs:

- [VS Code](https://code.visualstudio.com/) with [Copilot](https://github.com/features/copilot)
- [Cursor](https://cursor.com/)
- [Claude Code](https://claude.com/product/claude-code)

### Setup Steps

This is a **minimal scaffold** - you run the scaffolding commands yourself to maintain ownership of configuration and credentials. The repo provides structure, tooling, and guidance while keeping you in control.

Clone the repository and install dependencies

```bash
git clone git@github.com:PeterHewat/Reactor.git
cd reactor
npm run clean-install
```

Then follow [docs/setup.md](docs/setup.md) to scaffold your frontend and backend

## Project Structure

```text
apps/
  web/                  # React frontend
packages/
  ui/                   # Shared UI components
  utils/                # Shared utilities
convex/                 # Backend schema & functions
docs/                   # Documentation
prompts/                # AI prompt templates
```

## Documentation

- **[Setup Guide](docs/setup.md)** - Initial project scaffolding and configuration
- **[Architecture](docs/architecture.md)** - System design and technical decisions
- **[Product Requirements](docs/product.md)** - Business requirements and user stories
- **[Architecture Decisions](docs/adr/)** - Record of architectural decision records
- **[AI Prompt Templates](prompts/)** - Standardized prompts for development workflows

## Core Commands

```bash
npm run lint           # Lint all packages
npm run format         # Check formatting (Prettier)
npm run format:fix     # Fix formatting
npm run typecheck      # Type check all packages
npm run typecheck:refs # Type check with project references
npm run build          # Build all TypeScript projects
npm run clean          # Clean TypeScript build artifacts
npm test               # Run all unit tests
npm run e2e:install    # Install Playwright browsers (one-time)
npm run install        # Install dependencies (ignore scripts)
npm run clean-install  # Clean install (npm ci, ignore scripts)
npm run outdated       # Check for outdated dependencies
npm run update         # Update dependencies within semver ranges
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

- **CI (Push/PR to main):** Runs in [ci.yml](.github/workflows/ci.yml). Detects changes in frontend (apps/web, packages/ui, packages/utils) and backend (convex, packages/ui, packages/utils). For changed areas, executes `npm ci`, `npm run lint`, `npm run format`, `npm run typecheck`, and `npm test`
- **CD (Release published):** Runs in [cd.yml](.github/workflows/cd.yml). Parses tags `frontend-vX.Y.Z` or `backend-vX.Y.Z` and performs the same checks for the targeted area. Add platform-specific deploy steps later
- **Release Planning (Manual):** [release.yml](.github/workflows/release.yml) analyzes changes for `frontend`/`backend`, increments versions per selection (patch/minor/major), and creates GitHub releases. It preserves the concept of releasing frontend or backend independently
