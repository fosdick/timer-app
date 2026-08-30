#!/usr/bin/env bash
#
# Fleet screenshot capture. Builds the app ONCE, then for each simulator in the
# list below: boots it, pins a clean 9:41 status bar, installs the build, drives
# the .maestro/screens.yaml tour, and collects the PNGs into screenshots/<device>/.
#
# Self-sufficient about the environment the same way scripts/e2e.sh is: npm/sh do
# not source your interactive shell, so we wire up Maestro (~/.maestro/bin) and a
# real JDK here rather than trusting PATH/JAVA_HOME.
#
# Usage:
#   bash scripts/screenshots.sh            # build fresh, then capture
#   BUILD=0 bash scripts/screenshots.sh    # reuse the last Release build (skip rebuild)
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Ads OFF for capture. Store panels should show what a paying customer sees, and
# the AdMob TEST banner was otherwise landing in whichever panels the ad happened
# to win the race on. Exported here so it reaches the build below and NOWHERE
# else; scripts/preflight.sh fails if it is set when you go to ship.
export EXPO_PUBLIC_SCREENSHOT_MODE=1

# --- Device fleet ----------------------------------------------------------
# First two are the App Store Connect REQUIRED sizes (largest iPhone + iPad);
# the rest are marketing/QA extras. Edit this list freely — names must match
# `xcrun simctl list devices`.
#
# You can also override the list from the command line to run ONE device at a
# time (lightest on RAM — only one simulator is ever booted; the recommended way
# to avoid the machine choking on a long unattended fleet run):
#   npm run screenshots -- "iPhone 16"
#   BUILD=0 npm run screenshots -- "iPad Pro 13-inch (M5)"   # reuse cached build
# NOTE: names must match an EXISTING simulator instance, not just a device type.
# `simctl list devices available` can legitimately be EMPTY (an Xcode upgrade or a
# disk cleanup wipes the instances while leaving the runtimes installed) — in that
# case every device here is silently "Skipped" and you get empty output dirs. That
# is exactly what happened on the 2026-06-25 run. Create what you need first:
#   xcrun simctl create "iPhone 17 Pro Max" \
#     com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max \
#     com.apple.CoreSimulator.SimRuntime.iOS-26-5
# The app's deployment target is iOS 15.1 (expo-build-properties in app.json), so
# the runtime is rarely the constraint — a missing device instance usually is.
DEVICES=(
  "iPhone 17 Pro Max"          # App Store required — 6.9" iPhone
  "iPad Pro 13-inch (M5)"      # App Store required — 13" iPad
  "iPhone 17"                  # representative standard phone
  "iPhone 16e"                 # smallest modern phone — catches cramping
)
# Any names passed as arguments replace the default fleet.
if [ "$#" -gt 0 ]; then
  DEVICES=("$@")
fi

APP_ID="com.example.timer-app"
FLOW=".maestro/screens.yaml"
OUT_DIR="screenshots"

# --- Tooling: Maestro + a real JDK (see scripts/e2e.sh for the why) --------
[ -d "$HOME/.maestro/bin" ] && export PATH="$HOME/.maestro/bin:$PATH"
if [ -z "${JAVA_HOME:-}" ]; then
  if jh="$(/usr/libexec/java_home 2>/dev/null)"; then
    export JAVA_HOME="$jh"
  else
    jdk="$(ls -d "$HOME"/.jdks/*/Contents/Home 2>/dev/null | head -1 || true)"
    [ -n "$jdk" ] && export JAVA_HOME="$jdk"
  fi
fi
[ -n "${JAVA_HOME:-}" ] && export PATH="$JAVA_HOME/bin:$PATH"

if ! command -v maestro >/dev/null 2>&1; then
  echo "maestro not found. Install it:" >&2
  echo "  brew install mobile-dev-inc/tap/maestro   # or:" >&2
  echo "  curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 127
fi

# --- Locate the build (capture-only — this script does NOT build) ----------
# Building React Native correctly (codegen specs + JS bundle) is fragile to do by
# hand; a custom-derivedDataPath xcodebuild here once deleted the codegen artifacts
# and broke the build. So building is a PREREQUISITE done with the blessed command:
#
#   npx expo run:ios --configuration Release      # builds + installs (Ctrl-C after it boots)
#
# To pick up fresh .tsx changes, reset Metro's transform cache first so the JS
# re-bundles from current source (the Xcode "Bundle React Native" phase runs every
# build, but it can serve stale transforms from a warm cache):
#
#   rm -rf "$TMPDIR"/metro-* "$TMPDIR"/haste-map-*
#
# This script just finds the most recent VALID Release simulator build and shoots it.
# Search DerivedData only (where Xcode ▶ / expo run:ios land builds) — NOT ios/build,
# which can hold an incomplete stub from a half-finished xcodebuild. We also skip any
# .app missing a CFBundleIdentifier (an empty shell -> "Missing bundle ID" on install).
APP_PATH=""
while IFS= read -r cand; do
  [ -d "$cand" ] || continue
  plutil -extract CFBundleIdentifier raw "$cand/Info.plist" >/dev/null 2>&1 || continue
  APP_PATH="$cand"; break
done < <(find "$HOME/Library/Developer/Xcode/DerivedData" \
  -name "TimerAppYoga.app" -path "*Release-iphonesimulator*" 2>/dev/null \
  | xargs -I{} stat -f '%m %N' {} 2>/dev/null | sort -rn | cut -d' ' -f2-)

if [ -z "${APP_PATH:-}" ] || [ ! -d "$APP_PATH" ]; then
  echo "No valid Release simulator build found. Build it first:" >&2
  echo "  npx expo run:ios --configuration Release   (Ctrl-C once the app boots)" >&2
  exit 1
fi
echo "==> Using app bundle: $APP_PATH"
echo "    (built $(stat -f '%Sm' "$APP_PATH"))"

# --- Capture per device ----------------------------------------------------
mkdir -p "$OUT_DIR"

# Every device that produced NO screenshots, for the end-of-run summary. A run
# that quietly yields empty dirs is worse than a loud failure: the 2026-06-25
# run "succeeded" with two empty required-size dirs and nobody noticed until the
# App Store upload.
FAILED=()

# Resolve a device name -> udid (first match among AVAILABLE devices).
# App's minimum iOS (e.g. 26.0) -> integer major*1000+minor for comparison.
APP_MIN_RAW="$(plutil -extract MinimumOSVersion raw "$APP_PATH/Info.plist" 2>/dev/null || echo 0)"
APP_MIN_VER="$(echo "$APP_MIN_RAW" | awk -F. '{print $1*1000+($2==""?0:$2)}')"

# Resolve a device NAME to the UDID of its NEWEST-iOS available sim, printing
# "<ver> <udid>" so the caller can also gate on the iOS version. There are
# multiple sims per device (one per installed runtime); naively taking the first
# match can grab an old iOS that's below the app's deployment target.
udid_ver_for() {
  xcrun simctl list devices available | awk -v dev="$1" '
    /^-- iOS / { v=$0; sub(/^-- iOS /,"",v); sub(/ --.*/,"",v);
                 n=split(v,a,"."); ver=a[1]*1000+(n>1?a[2]:0); next }
    /^-- /     { ver=-1; next }                       # non-iOS runtime section
    ver>=0 && index($0, dev " (")>0 {
      s=$0
      while (match(s,/\(/)) { s=substr(s,RSTART+1); p=index(s,")"); cand=substr(s,1,p-1)
        if (length(cand)==36) { print ver" "cand; break } } }
  ' | sort -rn | head -1
}

for name in "${DEVICES[@]}"; do
  read -r dev_ver udid <<<"$(udid_ver_for "$name")"
  if [ -z "${udid:-}" ]; then
    echo "!! Skipping '$name' — no matching available simulator instance." >&2
    FAILED+=("$name (no simulator instance — create it with simctl create)")
    continue
  fi
  # Guard: the app won't install on a sim older than its deployment target.
  if [ "${dev_ver:-0}" -lt "${APP_MIN_VER:-0}" ]; then
    have="$(awk -v v="$dev_ver" 'BEGIN{printf "%.1f", int(v/1000)+(v%1000)/10}')"
    echo "!! Skipping '$name' — newest sim is iOS $have but the app needs iOS $APP_MIN_RAW." >&2
    echo "   (Pick a device that ships an iOS-$APP_MIN_RAW simulator, e.g. iPhone 16e / 17.)" >&2
    FAILED+=("$name (newest sim iOS $have < app min $APP_MIN_RAW)")
    continue
  fi
  slug="$(echo "$name" | tr ' ()' '-' | tr -s '-' | sed 's/-$//')"
  dest="$OUT_DIR/$slug"
  echo ""
  echo "==> $name  ($udid)"
  rm -rf "$dest"; mkdir -p "$dest"

  xcrun simctl boot "$udid" 2>/dev/null || true
  xcrun simctl bootstatus "$udid" -b >/dev/null 2>&1 || true
  open -a Simulator --args -CurrentDeviceUDID "$udid" >/dev/null 2>&1 || true

  # Store-quality status bar: 9:41, full battery, full bars.
  xcrun simctl status_bar "$udid" override \
    --time "9:41" \
    --batteryState charged --batteryLevel 100 \
    --cellularMode active --cellularBars 4 \
    --wifiMode active --wifiBars 3 \
    --dataNetwork wifi >/dev/null 2>&1 || true

  xcrun simctl install "$udid" "$APP_PATH"

  # Run the tour against THIS device; PNGs land in $dest (maestro writes to CWD).
  ( cd "$dest" && maestro --device "$udid" test "../../$FLOW" ) \
    || echo "!! Maestro tour failed for $name (see output above)." >&2

  xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true

  shot_count="$(find "$dest" -name '*.png' | wc -l | tr -d ' ')"
  if [ "$shot_count" -eq 0 ]; then
    echo "!! $name produced NO screenshots." >&2
    FAILED+=("$name (tour produced no PNGs)")
  else
    echo "   saved $shot_count shots -> $dest/"
  fi
done

osascript -e 'quit app "Simulator"' >/dev/null 2>&1 || true

echo ""
if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "==> FAILED — no screenshots for ${#FAILED[@]} device(s):" >&2
  for f in "${FAILED[@]}"; do echo "     - $f" >&2; done
  echo "   (see the DEVICES note at the top of this script)" >&2
  exit 1
fi
echo "==> Done. Screenshots under ./$OUT_DIR/<device>/"
