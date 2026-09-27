#!/usr/bin/env bash
# Prints the notes GitHub would generate for <tag>: PRs merged to main since
# the latest release, grouped by .github/release.yml. Headings are demoted a
# level so they nest under the version heading in CHANGELOG.md.
#
# Usage: scripts/release-notes.sh <tag>
set -euo pipefail

tag="${1:?usage: scripts/release-notes.sh <tag>}"
previous="$(gh release view --json tagName --jq .tagName)"

gh api "repos/{owner}/{repo}/releases/generate-notes" \
  -f tag_name="$tag" \
  -f target_commitish=main \
  -f previous_tag_name="$previous" \
  --jq .body |
  tr -d '\r' |
  sed -e '/^<!-- Release notes generated/d' -e 's/^#/##/' |
  cat -s |
  sed '/./,$!d'
