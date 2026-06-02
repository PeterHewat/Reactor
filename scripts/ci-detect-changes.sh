#!/usr/bin/env bash
# Emits GitHub Actions outputs: web, marketing, convex, shared, config, any, docs_only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/monorepo-paths.sh
source "${SCRIPT_DIR}/lib/monorepo-paths.sh"

web=false
marketing=false
convex=false
shared=false
config=false
docs_only=false

CHANGED_FILES="${CHANGED_FILES:-}"

# Empty diff (e.g. first push) — run full CI rather than false-green
if [ -z "$CHANGED_FILES" ]; then
  config=true
fi

for file in $CHANGED_FILES; do
  case "$file" in
    apps/web/*) web=true ;;
    apps/marketing/*) marketing=true ;;
    convex/*) convex=true ;;
    scripts/* | .github/actions/* | .husky/*) config=true ;;
    *.env.example | apps/*/.env.example | .env.example) config=true ;;
    package.json | bun.lock | eslint.config.js | tsconfig.json | tsconfig.* | .github/workflows/* | .github/dependabot.yml | .github/release.yml | .github/CODEOWNERS | .github/pull_request_template.md | .github/actions/*)
      config=true
      ;;
    .prettierrc.json | .prettierignore | .gitignore | .bun-version | .node-version | .vscode/settings.json)
      config=true
      ;;
  esac

  if path_is_shared_package "$file"; then
    shared=true
  fi
done

# Unclassified root/meta changes should not produce a false-green CI required
if [ -n "$CHANGED_FILES" ] && [ "$web" = "false" ] && [ "$marketing" = "false" ] && [ "$convex" = "false" ] && [ "$shared" = "false" ] && [ "$config" = "false" ]; then
  config=true
fi

if [ "$shared" = "true" ] || [ "$config" = "true" ]; then
  web=true
  marketing=true
  convex=true
fi

any=false
if [ "$web" = "true" ] || [ "$marketing" = "true" ] || [ "$convex" = "true" ]; then
  any=true
fi

if [ -n "$CHANGED_FILES" ] && [ "$any" = "false" ]; then
  all_format_only=true
  for file in $CHANGED_FILES; do
    case "$file" in
      docs/*) ;;
      README.md | CONTRIBUTING.md | AGENTS.md | CLAUDE.md | SECURITY.md | LICENSE) ;;
      *) all_format_only=false; break ;;
    esac
  done
  if [ "$all_format_only" = "true" ]; then
    docs_only=true
  fi
fi

echo "web=$web" >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT required}"
echo "marketing=$marketing" >> "$GITHUB_OUTPUT"
echo "convex=$convex" >> "$GITHUB_OUTPUT"
echo "shared=$shared" >> "$GITHUB_OUTPUT"
echo "config=$config" >> "$GITHUB_OUTPUT"
echo "any=$any" >> "$GITHUB_OUTPUT"
echo "docs_only=$docs_only" >> "$GITHUB_OUTPUT"

echo "Detected: web=$web marketing=$marketing convex=$convex shared=$shared config=$config any=$any docs_only=$docs_only"
