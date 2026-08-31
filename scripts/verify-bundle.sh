#!/usr/bin/env bash
# Assert that a built app's embedded JS actually contains a string you know is new.
#
#   bash scripts/verify-bundle.sh '#4E5346'            # search every built product
#   bash scripts/verify-bundle.sh '#4E5346' iphoneos   # just device builds
#
# Use it after EVERY build you are about to trust — sideload, TestFlight, submit.
# "Build Succeeded" does not mean your JS is in there; see scripts/fresh-bundle.sh.
set -euo pipefail

needle="${1:?usage: verify-bundle.sh <string-you-know-is-new> [product-filter]}"
filter="${2:-}"
DD="${DERIVED_DATA:-$HOME/Library/Developer/Xcode/DerivedData}"

status=1
while IFS= read -r b; do
  [ -n "$filter" ] && case "$b" in *"$filter"*) ;; *) continue ;; esac
  n=$(LC_ALL=C grep -ao -- "$needle" "$b" 2>/dev/null | wc -l | tr -d ' ')
  when=$(date -r "$b" "+%Y-%m-%d %H:%M")
  if [ "$n" -gt 0 ]; then
    echo "  OK    $when  ${b#"$DD"/}"
    status=0
  else
    echo "  STALE $when  ${b#"$DD"/}  <- does NOT contain $needle"
  fi
done < <(find "$DD"/TimerAppYoga-* -maxdepth 5 -path "*/Build/Products/*/TimerAppYoga.app/main.jsbundle" 2>/dev/null)

[ "$status" -eq 0 ] || { echo "no built bundle contains '$needle'"; exit 1; }
