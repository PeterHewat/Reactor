#!/usr/bin/env bash
# Sync GitHub issue/PR labels with .github/release.yml and repo workflows.
# Usage: bash scripts/sync-github-labels.sh

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh not found in PATH" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh is not authenticated" >&2
  exit 1
fi

REPO_ARGS=()
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  REPO_ARGS=(-R "$GITHUB_REPOSITORY")
elif git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ARGS=(-R "$(gh repo view --json nameWithOwner -q .nameWithOwner)")
fi

# name|color (6 hex, no #)|description
LABELS=(
  "breaking-change|b60205|Breaking API or behavior change"
  "security|ff0000|Security fix or hardening"
  "enhancement|0e8a16|New feature or request"
  "fix|d73a4a|Bug fix (use on pull requests)"
  "bug|d73a4a|Something is not working (issues; also accepted on PRs)"
  "documentation|0075ca|Improvements or additions to documentation"
  "dependencies|0366d6|Dependency updates"
  "github-actions|000000|GitHub Actions version updates"
  "chore|fef2c0|Internal work with no user-facing impact"
  "test|ededed|Test-only changes (excluded from release notes)"
  "ignore-for-release|ffffff|Exclude from generated release notes"
  "e2e|f9d0c4|Run Playwright E2E in CI (opt-in PR label)"
  "preview|c5def5|Deploy PR previews (opt-in PR label)"
  "monorepo|ededed|Monorepo-wide dependency update (Dependabot)"
  "typescript|3178c6|TypeScript-related dependency update (Dependabot)"
  "duplicate|cfd3d7|This issue or pull request already exists"
  "invalid|e4e669|This does not seem right"
  "wontfix|ffffff|This will not be worked on"
  "question|d876e3|Further information is requested"
  "good first issue|7057ff|Good for newcomers"
  "help wanted|008672|Extra attention is needed"
)

echo "Syncing ${#LABELS[@]} labels to $(gh repo view "${REPO_ARGS[@]}" --json nameWithOwner -q .nameWithOwner)..."
echo ""

for entry in "${LABELS[@]}"; do
  IFS='|' read -r name color description <<< "$entry"
  gh label create "$name" --color "$color" --description "$description" --force "${REPO_ARGS[@]}"
  echo "  ✓ $name"
done

echo ""
echo "Done."
