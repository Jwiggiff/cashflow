#!/usr/bin/env bash
# Prints the body of <tag>'s section in CHANGELOG.md (empty if it has none).
#
# Usage: scripts/changelog-entry.sh <tag>
set -euo pipefail

tag="${1:?usage: scripts/changelog-entry.sh <tag>}"

awk -v tag="$tag" '
  $0 == "## " tag || index($0, "## " tag " ") == 1 { found = 1; next }
  found && /^## v[0-9]/ { exit }
  found { print }
' CHANGELOG.md
