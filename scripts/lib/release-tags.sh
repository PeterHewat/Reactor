#!/usr/bin/env bash
# Monorepo release tags (sourced by release.yml).
#
# Tags: release-{yyyy-MM-dd-HH-mm-ss} (UTC)

RELEASE_STAMP_PATTERN='[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}'

# @returns UTC timestamp used in release tags (e.g. 2026-06-07-18-55-37)
release_timestamp_utc() {
  date -u +%Y-%m-%d-%H-%M-%S
}

# @returns latest release-* tag, or empty when none exist
latest_release_tag() {
  git tag -l "release-*" --sort=-creatordate | grep -E "^release-${RELEASE_STAMP_PATTERN}$" | head -n1 || true
}

# @param $1 UTC timestamp from release_timestamp_utc
# @returns full tag (e.g. release-2026-06-07-18-55-37)
release_tag() {
  local stamp="$1"
  echo "release-${stamp}"
}
