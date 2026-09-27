#!/usr/bin/env bash
# Opens a release PR that bumps the version and prepends a CHANGELOG.md entry.
# Merging the PR publishes the release (see .github/workflows/release.yml).
#
# Usage:
#   npm run release <patch|minor|major>   from main: open a release PR
#   npm run release refresh               from the release branch: merge main
#                                         and regenerate the changelog entry
set -euo pipefail

usage() {
  echo "Usage: npm run release <patch|minor|major|refresh>" >&2
  exit 1
}

die() {
  echo "error: $*" >&2
  exit 1
}

# Replaces any existing CHANGELOG.md section for $1 with freshly generated
# notes, placed right after the "# Changelog" title.
write_changelog_entry() {
  local tag="$1" entry updated
  entry="$(mktemp)"
  updated="$(mktemp)"
  printf '## %s (%s)\n\n%s\n\n' "$tag" "$(date +%Y-%m-%d)" \
    "$(scripts/release-notes.sh "$tag")" >"$entry"
  awk -v tag="$tag" -v entry="$entry" '
    NR == 1 { print; print ""; while ((getline line < entry) > 0) print line; next }
    NR == 2 && $0 == "" { next }
    $0 == "## " tag || index($0, "## " tag " ") == 1 { skip = 1; next }
    skip && /^## v[0-9]/ { skip = 0 }
    !skip { print }
  ' CHANGELOG.md >"$updated"
  cat "$updated" >CHANGELOG.md
  rm -f "$entry" "$updated"
}

command="${1:-}"
case "$command" in
  patch | minor | major | refresh) ;;
  *) usage ;;
esac

[ -z "$(git status --porcelain)" ] || die "working tree is not clean"
git fetch --quiet origin main

if [ "$command" = refresh ]; then
  branch="$(git branch --show-current)"
  version="v$(node -p "require('./package.json').version")"
  [ "$branch" = "release/$version" ] ||
    die "run this from the release branch (release/$version)"

  git merge --quiet --no-edit origin/main ||
    die "merge conflicts: resolve and commit them, then run this again"
  write_changelog_entry "$version"
  if [ -n "$(git status --porcelain CHANGELOG.md)" ]; then
    git commit --quiet -m "Refresh $version changelog" CHANGELOG.md
  fi
  git push --quiet
  echo "Refreshed $branch"
  exit 0
fi

[ "$(git branch --show-current)" = main ] || die "run this from main"
[ "$(git rev-parse main)" = "$(git rev-parse origin/main)" ] ||
  die "main is not in sync with origin/main (git pull first)"

version="$(npm version "$command" --no-git-tag-version --ignore-scripts)"
if [ -n "$(git ls-remote --tags origin "refs/tags/$version")" ]; then
  git checkout -- package.json package-lock.json
  die "tag $version already exists"
fi
write_changelog_entry "$version"

branch="release/$version"
git switch --quiet -c "$branch"
git add package.json package-lock.json CHANGELOG.md
git commit --quiet -m "Release $version"
git push --quiet -u origin "$branch"

gh label create release --color 5319e7 \
  --description "Version bump PR (excluded from release notes)" --force >/dev/null
url="$(
  gh pr create --base main --head "$branch" --label release \
    --title "Release $version" \
    --body "Bumps the version to \`$version\` and adds its \`CHANGELOG.md\` entry.

Edit the changelog entry in this PR if needed. If other PRs merge into main first, the \"Release changelog\" check fails until you run \`npm run release refresh\` on this branch. That regenerates the entry, so any hand edits need to be redone.

Merging publishes the release: the Docker image, the \`$version\` tag on the merge commit, and a GitHub release with these notes."
)"

git switch --quiet main
echo "Opened $url"
