# Security Policy

## Reporting a vulnerability

If you discover a security issue in this template, please report it privately:

- Open a [GitHub Security Advisory](https://github.com/PeterHewat/Reactor/security/advisories/new) (preferred for this repo), or
- Email the maintainer via the contact in [package.json](package.json) (`author` field)

Do not open a public issue for undisclosed vulnerabilities.

## Secrets and credentials

- Never commit `.env`, `.env.local`, API keys, or deploy tokens.
- Use `.env.example` files as templates only.
- Store CI secrets in GitHub Actions repository secrets (see [docs/ci-cd.md](docs/ci-cd.md#github-actions-secrets)).

## Dependency updates

Run `bun run audit` locally. CI fails on **high** and **critical** advisories (`bun audit --audit-level=high`).

CI also runs [Gitleaks](https://github.com/gitleaks/gitleaks) on every push/PR to detect committed secrets.

For CSP and response headers, see [docs/security-headers.md](docs/security-headers.md).
