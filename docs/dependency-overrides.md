# Dependency overrides

Root [package.json](../package.json) `overrides` pin **transitive** dependency versions for security fixes. Run `bun run audit` after changing them. **Keep the version column in this table aligned with `package.json` on every override change.**

| Package             | Override   | Reason                                                                                                   |
| ------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `ws`                | `^8.21.0`  | ReDoS / security advisories in older 8.x                                                                 |
| `devalue`           | `^5.8.1`   | Astro SSR serialization; keep on patched 5.x                                                             |
| `minimatch`         | `^10.2.5`  | ReDoS in older minimatch                                                                                 |
| `glob`              | `^13.0.6`  | Aligns with minimatch 10.x tree                                                                          |
| `test-exclude`      | `^8.0.0`   | Coverage tooling chain                                                                                   |
| `brace-expansion`   | `^5.0.6`   | ReDoS in older brace-expansion                                                                           |
| `picomatch`         | `^4.0.4`   | Aligns with tooling that depends on picomatch 4                                                          |
| `yaml`              | `^2.9.0`   | [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) (stack overflow in nested YAML) |
| `@tootallnate/once` | `^2.0.1`   | [GHSA-vpq2-c234-7xj6](https://github.com/advisories/GHSA-vpq2-c234-7xj6) (Vercel CLI / `@vercel/fun`)    |
| `smol-toml`         | `^1.6.1`   | [GHSA-v3rj-xjv7-4jmq](https://github.com/advisories/GHSA-v3rj-xjv7-4jmq) (Vercel CLI / Astro helpers)    |
| `tar`               | `^7.5.16`  | [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx) (Vercel CLI extraction)         |
| `srvx`              | `^0.11.16` | [GHSA-p36q-q72m-gchr](https://github.com/advisories/GHSA-p36q-q72m-gchr) (`@vercel/backends`)            |
| `path-to-regexp`    | `^8.4.2`   | [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) (Vercel CLI 6.x pins)           |
| `undici`            | `^7.27.2`  | Multiple GHSA advisories in Vercel CLI / Astro transitive tree                                           |

Re-add an override only when `bun audit` reports a vulnerable range and upstream has not released a fix.

**`ajv`:** No global override. ESLint 10 requires ajv 6 (`json-schema-draft-04`); forcing ajv 8.x breaks `bun run lint`. Bun applies overrides tree-wide (no per-package scoping). [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) is **moderate** and only affects the `$data` option; ESLint’s ajv 6.14+ includes the backport. `bun run audit` uses `--audit-level=high` (same as CI) so this advisory does not fail the gate.
