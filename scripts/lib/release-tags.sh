#!/usr/bin/env bash
# Monorepo release tags (sourced by release.yml).
#
# Tags: dev-{yyyy-MM-dd-HH-mm-ss} | prod-{yyyy-MM-dd-HH-mm-ss} (UTC)

RELEASE_STAMP_PATTERN='[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}'

# @returns UTC timestamp used in release tags (e.g. 2026-06-07-18-55-37)
release_timestamp_utc() {
  date -u +%Y-%m-%d-%H-%M-%S
}

# @param $1 "true" for development lane (pre-release), else production
# @returns latest tag in that lane, or empty when none exist
latest_release_tag() {
  local pre_release="$1"
  if [ "$pre_release" = "true" ]; then
    git tag -l "dev-*" --sort=-creatordate | grep -E "^dev-${RELEASE_STAMP_PATTERN}$" | head -n1
  else
    git tag -l "prod-*" --sort=-creatordate | grep -E "^prod-${RELEASE_STAMP_PATTERN}$" | head -n1
  fi
}

# @param $1 UTC timestamp from release_timestamp_utc
# @param $2 "true" for development (pre-release), else production
# @returns full tag (e.g. dev-2026-06-07-18-55-37 or prod-2026-06-07-18-55-37)
release_tag() {
  local stamp="$1"
  local pre_release="$2"
  if [ "$pre_release" = "true" ]; then
    echo "dev-${stamp}"
  else
    echo "prod-${stamp}"
  fi
}
