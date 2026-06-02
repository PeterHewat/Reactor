# Security Policy

## Reporting a vulnerability

If you discover a security issue in this template, please report it privately:

- Open a **private** GitHub Security Advisory on **your** repository (Settings → Security → Advisories), or
- Email the maintainer via the contact in [package.json](package.json) (`author` field)

After [**Use this template**](https://github.com/PeterHewat/Reactor/generate), update this section so reports go to your org — see [docs/getting-started.md §7](docs/getting-started.md#7-verify-identity-usually-done-by-setup).

Do not open a public issue for undisclosed vulnerabilities.

## Secrets and credentials

- Never commit `.env`, `.env.local`, API keys, or deploy tokens.
- Use `.env.example` files as templates only.
- Store CI secrets in GitHub Actions repository secrets (see [docs/ci-cd.md](docs/ci-cd.md#github-actions-secrets)).

## Dependency updates

Run `bun run audit` locally. CI fails on **high** and **critical** advisories (`bun audit --audit-level=high`). Transitive pins are documented in [docs/dependency-overrides.md](docs/dependency-overrides.md).

CI also runs [Gitleaks](https://github.com/gitleaks/gitleaks) on every push/PR to detect committed secrets.

For CSP and response headers, see [docs/security-headers.md](docs/security-headers.md).
