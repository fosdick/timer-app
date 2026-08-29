#!/usr/bin/env bash
# Delete the embedded JS bundle from every built product, so the next build is
# forced to regenerate it.
#
# Why this exists: a Release build whose native inputs are unchanged will happily
# reuse an existing main.jsbundle and report "Build Succeeded" — so a JS-only
# change (a colour, a layout, a bug fix) can be completely absent from an app that
# just built cleanly. It cost us three stale artifacts: two .ipa handoffs and a
# simulator build that was verified against midnight's code.
#
# Verified: with the bundle present the phase is skipped; with it deleted the
# bundle is rebuilt (timestamp and contents both change).
set -euo pipefail

DD="${DERIVED_DATA:-$HOME/Library/Developer/Xcode/DerivedData}"
found=0
while IFS= read -r b; do
  echo "  rm $b"
  rm -f "$b"
  found=$((found + 1))
done < <(find "$DD"/TimerAppYoga-* -maxdepth 5 -path "*/Build/Products/*/TimerAppYoga.app/main.jsbundle" 2>/dev/null)

echo "removed $found embedded bundle(s); the next build must regenerate them"
