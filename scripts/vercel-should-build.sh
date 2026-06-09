#!/usr/bin/env bash
# Vercel Ignored Build Step — build on `main` only (staging). Exit 1 = build, 0 = skip.
set -euo pipefail
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == "main" ]]; then
  exit 1
fi
exit 0
