#!/usr/bin/env bash
# Builds the static site for GitHub Pages and copies it to ../cs (served at https://mshbkr9-pixel.github.io/setim/cs/).
# After running it: commit, then push to main — every push to main is published automatically.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf out
PAGES_BASE_PATH=/setim/cs npx next build
rm -rf ../cs
cp -r out ../cs
touch ../.nojekyll   # GitHub Pages must not run Jekyll, which would drop the _next/ folder
echo "ready: ../cs ($(find ../cs -type f | wc -l) files)"
