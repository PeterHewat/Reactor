# Contributing

Conventions for humans and agents working in this repo. For onboarding, see [docs/getting-started.md](docs/getting-started.md). For CI, releases, and E2E labels, see [docs/ci-cd.md](docs/ci-cd.md).

## Git hooks (Husky)

After `bun install`, Husky runs **lint-staged** on commit: ESLint with `--fix` and Prettier on staged files. Bypass with `git commit --no-verify` if needed; CI still enforces full-repo checks.

## Branching and pull requests

- `main` holds the latest stable code and should be protected
- Create feature branches from `main` (e.g. `feature/short-description`)
- Open a pull request; CI must pass and a reviewer should approve
- Use squash merge; keep the squash commit message clear

**Fork PRs:** Pull requests from forks do not get repository Actions secrets, so Convex builds and authenticated smoke may be skipped while **CI required** still passes. If this repo accepts public contributions, read [docs/ci-cd.md § Fork PRs and CI](docs/ci-cd.md#fork-prs-and-ci) before relying on green CI from external forks.

## Commit messages

- Separate subject from body with a blank line
- Limit the subject line to 50 characters
- Capitalize the subject line; do not end with a period
- Use imperative mood in the subject
- Wrap the body at 72 characters; explain what and why, not how

Reference: [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

## Dependencies and semver

- Root `overrides` (security pins): see [docs/dependency-overrides.md](docs/dependency-overrides.md); update that doc when changing `package.json` overrides
- Check updates: `bun run outdated`
- Update within declared semver ranges: `bun run update`
- Semver in `package.json`: `^` minor, `~` patch, pinned = no automatic updates

To update outside ranges, edit versions in `package.json`, then run `bun update`.

## TypeScript version policy

- Root and workspaces use `typescript: "~6.0.3"` — patch updates within 6.0.x only
- Do not mix `^6.0.3` in workspaces unless you intentionally want minor bumps
- Bump TypeScript deliberately: edit `~6.0.3` in root and workspace packages together, then `bun install`

## E2E and previews on pull requests

Playwright and preview deploys are **opt-in** via PR labels. See [docs/ci-cd.md](docs/ci-cd.md#ci-and-test-jobs) (`e2e`, `preview`) and [docs/development.md](docs/development.md#e2e-tests-playwright) for local runs.

## Agent rules

Automated agents should follow [AGENTS.md](AGENTS.md) (verify: `bun run format:fix && bun run lint && bun run typecheck && bun run test`). Precedence index: [docs/agent-guidance.md](docs/agent-guidance.md).
