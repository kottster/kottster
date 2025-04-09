#!/bin/bash

# To run this script, use the command:
# ./release.sh <package-name>

if [ -z "$1" ]; then
  echo "Usage: ./release.sh <package-name>"
  echo "Available: common, cli, server"
  exit 1
fi

cd "packages/$1" || exit

# Get version and name from package.json
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME=$(node -p "require('./package.json').name")

# Create and push tag
git tag "${PACKAGE_NAME}@${VERSION}"
git push origin "${PACKAGE_NAME}@${VERSION}"

echo "Tagged ${PACKAGE_NAME}@${VERSION}"