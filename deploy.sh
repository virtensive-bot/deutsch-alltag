#!/bin/sh
# Build and publish dist/ to the gh-pages branch (GitHub Pages).
set -e
cd "$(dirname "$0")"
npm run build
REMOTE=$(git remote get-url origin)
TMP=$(mktemp -d)
cp -R dist/ "$TMP/"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f -q "$REMOTE" gh-pages
rm -rf "$TMP"
echo "Deployed."
