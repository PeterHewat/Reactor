#!/usr/bin/env bash
# Shared path roots for CI change detection.
# Sourced by scripts/ci-detect-changes.sh

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
