#!/usr/bin/env bash
# Validates CI job results for branch protection. Used by ci.yml `required` job.
set -euo pipefail

failures=()

# check_job NAME EXPECTED RESULT
check_job() {
  local name="$1"
  local expected="$2"
  local result="$3"
  if [ "$expected" = "true" ] && [ "$result" != "success" ]; then
    failures+=("$name (expected success, got ${result:-missing})")
  fi
}

check_job "checks" "true" "${CHECKS_RESULT:-}"

any="${ANY:-false}"
web="${WEB:-false}"
marketing="${MARKETING:-false}"
convex="${CONVEX:-false}"
shared="${SHARED:-false}"
config="${CONFIG:-false}"
docs_only="${DOCS_ONLY:-false}"
convex_ci_tests="${CONVEX_CI_TESTS:-false}"

if [ "$web" = "true" ]; then
  check_job "web" "true" "${WEB_RESULT:-}"
fi

if [ "$marketing" = "true" ]; then
  check_job "marketing" "true" "${MARKETING_RESULT:-}"
fi

if [ "$convex" = "true" ] && [ "$convex_ci_tests" = "true" ]; then
  check_job "convex" "true" "${CONVEX_RESULT:-}"
fi

if [ "$shared" = "true" ] || [ "$config" = "true" ]; then
  check_job "packages" "true" "${PACKAGES_RESULT:-}"
fi

if [ ${#failures[@]} -gt 0 ]; then
  echo "::error::CI required checks failed:"
  for f in "${failures[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Configure repository secrets (e.g. CONVEX_DEPLOY_KEY for CI) before opening PRs (see docs/ci-cd.md#repository-secrets)."
  exit 1
fi

echo "All required CI jobs succeeded for changed paths."
