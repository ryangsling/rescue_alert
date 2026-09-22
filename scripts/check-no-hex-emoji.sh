#!/usr/bin/env bash
# Fails if a raw hex colour or an emoji appears in application source.
#
# Raw hex values belong only in packages/design-tokens (the token
# definitions themselves); everywhere else feature code must reference
# a semantic token. Emojis are never allowed in code, comments, or UI
# copy per AGENTS.md.
set -euo pipefail

cd "$(dirname "$0")/.."

SOURCE_GLOBS=(apps packages supabase)
EXCLUDE_DIRS=(node_modules dist .next .expo .turbo coverage packages/design-tokens)

exclude_args=()
for dir in "${EXCLUDE_DIRS[@]}"; do
  exclude_args+=(--exclude-dir="$dir")
done

status=0

echo "Checking for raw hex colours outside packages/design-tokens..."
if grep -rEn "${exclude_args[@]}" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.css' \
  '#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3}([0-9A-Fa-f]{2})?)?\b' \
  "${SOURCE_GLOBS[@]}" 2>/dev/null; then
  echo "Raw hex colours found above. Reference a design token instead."
  status=1
else
  echo "OK - no raw hex colours found."
fi

echo "Checking for emojis in source..."
if grep -rPn "${exclude_args[@]}" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.md' \
  '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]' \
  "${SOURCE_GLOBS[@]}" 2>/dev/null; then
  echo "Emojis found above. Remove them - see AGENTS.md."
  status=1
else
  echo "OK - no emojis found."
fi

exit $status
