# Contributing

Conventions for humans and agents working in this repo. For onboarding, see [docs/getting-started.md](docs/getting-started.md). For CI, releases, and E2E, see [docs/ci-cd.md](docs/ci-cd.md).

## Git hooks (Husky)

After `bun install`, Husky runs **lint-staged** on commit: ESLint with `--fix` and Prettier on staged files. Bypass with `git commit --no-verify` if needed; CI still enforces full-repo checks.

## Branching and pull requests

- `main` must be **protected**: changes only via pull request ([branch protection](docs/ci-cd.md#branch-protection))
- Create feature branches from `main` (e.g. `feature/short-description`)
- Open a pull request; CI runs on the PR and must pass before merge (CI is **not** re-run on merge to `main`)
- Use squash merge; keep the squash commit message clear

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

## E2E

Pull requests run **unit tests** only (lint, typecheck, build). **Playwright E2E** is manual or runs from **Release** before deploy (always against the dev stack). See [docs/ci-cd.md](docs/ci-cd.md#manual-workflows).

## Agent rules

Follow [AGENTS.md](AGENTS.md) and [docs/spec/](docs/spec/) for feature work.

- After editing a few files: `bunx prettier --write <path> …`
- Fast verify (code files touched): `bun run check` after formatting touched paths (`bun run lint` for `scripts/**` only); scoped tests per package path; full `bun run verify` per AGENTS.md § Verify gate (see file-type rules there)
- Docs-only minimum: `bunx prettier --write` on every touched path (see AGENTS.md § Verify gate)
