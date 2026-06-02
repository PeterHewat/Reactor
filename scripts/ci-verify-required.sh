#!/usr/bin/env bash
# Validates CI job results for branch protection. Used by ci.yml `ci-required` job.
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

# Always required
check_job "security-audit" "true" "${SECURITY_AUDIT_RESULT:-}"
check_job "secrets-scan" "true" "${SECRETS_SCAN_RESULT:-}"

any="${ANY:-false}"
web="${WEB:-false}"
marketing="${MARKETING:-false}"
convex="${CONVEX:-false}"
shared="${SHARED:-false}"
config="${CONFIG:-false}"
docs_only="${DOCS_ONLY:-false}"
convex_ci_tests="${CONVEX_CI_TESTS:-false}"

if [ "$any" = "true" ] || { [ "$docs_only" = "true" ] && [ "$any" = "false" ]; }; then
  check_job "quality" "true" "${QUALITY_RESULT:-}"
fi

if [ "$web" = "true" ]; then
  check_job "build-web" "true" "${BUILD_WEB_RESULT:-}"
  check_job "tests-web" "true" "${TESTS_WEB_RESULT:-}"
  check_job "storybook-ui-web" "true" "${STORYBOOK_RESULT:-}"
  check_job "coverage-ui-web" "true" "${COVERAGE_RESULT:-}"
  check_job "web-e2e-smoke" "true" "${WEB_E2E_SMOKE_RESULT:-}"
  if [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
    check_job "web-e2e" "true" "${WEB_E2E_RESULT:-}"
  fi
fi

if [ "$marketing" = "true" ]; then
  check_job "build-marketing" "true" "${BUILD_MARKETING_RESULT:-}"
  check_job "tests-marketing" "true" "${TESTS_MARKETING_RESULT:-}"
  if [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
    check_job "marketing-e2e" "true" "${MARKETING_E2E_RESULT:-}"
  fi
fi

if [ "$convex" = "true" ] && [ "$convex_ci_tests" = "true" ]; then
  check_job "tests-convex" "true" "${TESTS_CONVEX_RESULT:-}"
fi

if [ "$shared" = "true" ] || [ "$config" = "true" ]; then
  check_job "tests-packages" "true" "${TESTS_PACKAGES_RESULT:-}"
fi

if [ ${#failures[@]} -gt 0 ]; then
  echo "::error::CI required checks failed:"
  for f in "${failures[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Skipped Convex/typecheck/build jobs exit 0 when CONVEX_DEPLOY_KEY is missing."
  echo "Configure secrets (see docs/ci-cd.md) or set CI_STRICT=1 to fail closed (optional guardrail)."
  exit 1
fi

echo "All required CI jobs succeeded for changed paths."
