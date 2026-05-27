# Dependency overrides

Root [package.json](../package.json) `overrides` pin **transitive** dependency versions for security fixes. Run `bun run audit` after changing them. **Keep the version column in this table aligned with `package.json` on every override change.**

| Package           | Override  | Reason                                                                                                   |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `ws`              | `^8.21.0` | ReDoS / security advisories in older 8.x                                                                 |
| `devalue`         | `^5.8.1`  | Astro SSR serialization; keep on patched 5.x                                                             |
| `minimatch`       | `^10.2.5` | ReDoS in older minimatch                                                                                 |
| `glob`            | `^13.0.6` | Aligns with minimatch 10.x tree                                                                          |
| `test-exclude`    | `^8.0.0`  | Coverage tooling chain                                                                                   |
| `brace-expansion` | `^5.0.6`  | ReDoS in older brace-expansion                                                                           |
| `picomatch`       | `^4.0.4`  | Aligns with tooling that depends on picomatch 4                                                          |
| `yaml`            | `^2.9.0`  | [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) (stack overflow in nested YAML) |

## Removed overrides (not needed)

These were dropped after `bun audit` / semver review — they forced newer minors without a current advisory:

- `h3` — `unstorage` already accepts `^1.15.10`; no CVE at time of review
- `flatted` — `eslint` → `flat-cache` tree works without override
- `smol-toml` — Astro markdown stack resolves a safe version without override

Re-add an override only when `bun audit` reports a vulnerable range and upstream has not released a fix.
