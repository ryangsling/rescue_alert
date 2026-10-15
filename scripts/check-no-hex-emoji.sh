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
# --exclude-dir matches a single path component (basename), never a
# compound path - "packages/design-tokens" here would silently match
# nothing and the whole package would leak through unexcluded. Proven
# directly: this check passed for months only because no hex value
# existed in packages/design-tokens until Part 4 added one.
EXCLUDE_DIRS=(node_modules dist .next .expo .turbo coverage design-tokens)

exclude_args=()
for dir in "${EXCLUDE_DIRS[@]}"; do
  exclude_args+=(--exclude-dir="$dir")
done

status=0

echo "Checking for raw hex colours outside packages/design-tokens..."
# app.config.ts is Expo's native platform config (app icon, splash
# screen, Android notification-channel colour) - evaluated by Node/EAS
# build tooling before any app bundle or design-token import graph
# exists, and Expo's own config plugins require these as literal hex
# strings. Same category as packages/design-tokens itself, not feature
# code the rule is meant to police.
#
# Filtered out below rather than passed as a grep --exclude pattern:
# proven directly that GNU grep 3.11 silently ignores --exclude when
# --include is also given on a recursive directory search (it only
# applies when there is no --include) - the file would otherwise have
# leaked through unexcluded despite the flag being present.
hex_matches="$(grep -rEn "${exclude_args[@]}" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.css' \
  '#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3}([0-9A-Fa-f]{2})?)?\b' \
  "${SOURCE_GLOBS[@]}" 2>/dev/null | grep -v '/app\.config\.ts:' || true)"
if [[ -n "$hex_matches" ]]; then
  echo "$hex_matches"
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
