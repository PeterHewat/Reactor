#!/usr/bin/env bash
# Shared path roots for CI change detection and release tagging.
# Sourced by scripts/ci-detect-changes.sh and .github/workflows/release.yml

# Release: git diff roots per deployable component (trailing slash for `git diff -- path/`)
release_component_paths() {
  case "$1" in
    web)
      echo "apps/web/ packages/ui-web/ packages/utils/ packages/tokens/ packages/config/ packages/env-core/"
      ;;
    marketing)
      echo "apps/marketing/ packages/utils/ packages/tokens/ packages/config/ packages/env-core/"
      ;;
    convex)
      echo "convex/"
      ;;
    *)
      echo "Unknown release component: $1" >&2
      return 1
      ;;
  esac
}

# CI: workspace prefixes that fan out to web, marketing, and convex
SHARED_PACKAGE_PREFIXES=(
  packages/ui-web
  packages/utils
  packages/test-utils
  packages/tokens
  packages/config
  packages/env-core
)

# @param $1 changed file path
# @returns 0 when the file is under a shared package prefix
path_is_shared_package() {
  local file="$1"
  local prefix
  for prefix in "${SHARED_PACKAGE_PREFIXES[@]}"; do
    case "$file" in
      "${prefix}"/*) return 0 ;;
    esac
  done
  return 1
}
