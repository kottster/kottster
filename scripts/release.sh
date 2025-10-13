#!/usr/bin/env bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHANGELOG_PATH="$SCRIPT_DIR/../CHANGELOG.md"

# Extract notes for this version from CHANGELOG.md
NOTES=$(awk "/## \[$VERSION\]/ {flag=1; next} /^## \[/ {flag=0} flag" "$CHANGELOG_PATH")

if [ -z "$NOTES" ]; then
  echo "❌ No changelog section found for version $VERSION"
  exit 1
fi

git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"

gh release create "v$VERSION" --title "v$VERSION" --notes "$NOTES"

echo "✅ GitHub release v$VERSION published."
