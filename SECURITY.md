# Security Policy

## Reporting

Report vulnerabilities privately via GitHub Security Advisories or the contact in [package.json](package.json) (`author`). Do not open public issues for undisclosed vulnerabilities.

## Secrets and credentials

- Never commit `.env`, `.env.local`, API keys, or deploy tokens.
- Use `.env.example` files as templates only.
- Store CI secrets in GitHub **repository** secrets; production deploy credentials in the **`production`** environment ([docs/ci-cd.md](docs/ci-cd.md#github-environments), [docs/environments.md](docs/environments.md)).

## Dependency updates

Run `bun run audit` locally. CI fails on **high** and **critical** advisories (`bun audit --audit-level=high`). Transitive pins are documented in [docs/dependency-overrides.md](docs/dependency-overrides.md).

CI runs [Gitleaks](https://github.com/gitleaks/gitleaks) on every push/PR to detect committed secrets.

## Headers and CSP

Configured in `apps/web/vercel.json` and `apps/marketing/vercel.json`. For audits, use [prompts/security-review.md](prompts/security-review.md).
