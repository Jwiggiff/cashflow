#!/usr/bin/env bash
# Opens a release PR that bumps the version and prepends a CHANGELOG.md entry.
# Merging the PR publishes the release (see .github/workflows/release.yml).
#
# Usage: npm run release <patch|minor|major>
set -euo pipefail

die() {
  echo "error: $*" >&2
  exit 1
}

bump="${1:-}"
case "$bump" in
  patch | minor | major) ;;
  *)
    echo "Usage: npm run release <patch|minor|major>" >&2
    exit 1
    ;;
esac

[ -z "$(git status --porcelain)" ] || die "working tree is not clean"
[ "$(git branch --show-current)" = main ] || die "run this from main"
git fetch --quiet origin main
[ "$(git rev-parse main)" = "$(git rev-parse origin/main)" ] ||
  die "main is not in sync with origin/main (git pull first)"

version="$(npm version "$bump" --no-git-tag-version --ignore-scripts)"
if [ -n "$(git ls-remote --tags origin "refs/tags/$version")" ]; then
  git checkout -- package.json package-lock.json
  die "tag $version already exists"
fi

# Same notes GitHub generates for a release, grouped by .github/release.yml.
# Their headings are demoted a level so they nest under the version heading.
repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
previous="$(gh release view --json tagName --jq .tagName)"
notes="$(
  gh api "repos/$repo/releases/generate-notes" \
    -f tag_name="$version" \
    -f target_commitish=main \
    -f previous_tag_name="$previous" \
    --jq .body |
    tr -d '\r' |
    sed 's/^#/##/'
)"

entry="$(mktemp)"
updated="$(mktemp)"
trap 'rm -f "$entry" "$updated"' EXIT
printf '## %s (%s)\n\n%s\n\n' "$version" "$(date +%Y-%m-%d)" "$notes" >"$entry"
# Insert the entry after the "# Changelog" title
awk -v entry="$entry" '
  NR == 1 { print; print ""; while ((getline line < entry) > 0) print line; next }
  NR == 2 && $0 == "" { next }
  { print }
' CHANGELOG.md >"$updated"
cat "$updated" >CHANGELOG.md

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

Edit the changelog entry in this PR if needed. Merging publishes the release: the Docker image, the \`$version\` tag on the merge commit, and a GitHub release with these notes."
)"

git switch --quiet main
echo "Opened $url"
