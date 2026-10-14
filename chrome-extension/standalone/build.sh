#!/usr/bin/env bash
# Rebuilds dwao-a11y-audit.js from standalone/src/*.
# Run this after editing src/audit-engine.js or src/content.js.
set -euo pipefail
cd "$(dirname "$0")"
cat src/_header.txt src/audit-engine.js src/content.js > dwao-a11y-audit.js
echo "Built dwao-a11y-audit.js ($(wc -l < dwao-a11y-audit.js | tr -d ' ') lines)"
