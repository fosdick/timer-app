#!/usr/bin/env bash
#
# Compose App Store screenshots from raw simulator captures.
#
#   raw capture (screenshots/<device>/NN-name.png)
#     -> headline + full-bleed dark panel
#     -> store-shots/<device>/NN-name.png at the EXACT size Apple wants
#
# Why a script and not a design tool: the June release stalled partly because
# screenshots went stale the moment the UI changed and re-shooting was expensive
# enough to block everything. Re-running this is one command, so stale store
# images can never be a release blocker again.
#
# Renders with headless Google Chrome (already installed; no new dependencies —
# this repo is allergic to them, see docs/ on the parent node_modules shadow).
# ffmpeg was the obvious alternative but this machine's build has no drawtext.
#
# Usage:
#   bash scripts/store-shots.sh                       # every device dir found
#   bash scripts/store-shots.sh iPhone-17-Pro-Max     # just one
#
# Prerequisite: raw captures exist. Either
#   npm run screenshots -- "iPhone 17 Pro Max"        # Maestro tour, one device
# or drop captures into screenshots/<device>/ by hand.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 127; }

IN_DIR="screenshots"
OUT_DIR="store-shots"
BG="#080B0C"        # the app's own background — the bleed depends on this matching
INK="#CDDC39"       # lime, same as the countdowns and picker titles

# --- Headlines -------------------------------------------------------------
# Keyed by the raw capture's basename. One idea per panel, forming an arc:
# what it is -> rounds -> sounds -> yoga -> paces -> intervals.
# Ratified by the user 2026-08-27. Edit freely and re-run.
# Keys MUST match the takeScreenshot names in .maestro/screens.yaml. They drifted
# once — the tour was renamed and this map was not, so three of six panels were
# silently skipped and the run still exited 0. An unmapped capture is now a hard
# failure (see below), because a half-composed set that reports success is exactly
# the stale-store-image trap this script exists to prevent.
headline_for() {
  case "$1" in
    01-pranayama-idle)     echo "Breath timed by count, not by clock" ;;
    02-pranayama-countin)  echo "Begin in three. Then stop counting." ;;
    03-yoga-idle)          echo "Six patterns, six cues — quiet enough to forget" ;;
    04-yoga-running)       echo "Hold the pose. The timer keeps time." ;;
    05-yoga-paces)         echo "Save the sequences you return to" ;;
    06-meditation-idle)    echo "And a place to simply sit" ;;
    07-preferences)        echo "Six colours. Make it yours." ;;
    *)                     echo "" ;;
  esac
}

# Status-bar + nav-header height to crop off the top of each capture, in PIXELS
# per device scale. Cropping the mint header is deliberate: it leaves the panel
# entirely dark, so the capture's own #080B0C body bleeds into the canvas with no
# visible seam. That is the whole reason this reads as one surface instead of a
# screenshot pasted on a card.
crop_for() {
  case "$1" in
    iPhone*)  echo 330 ;;   # ~110pt at @3x
    iPad*)    echo 220 ;;   # ~110pt at @2x
    *)        echo 330 ;;
  esac
}

compose_one() {
  local raw="$1" out="$2" headline="$3" crop="$4" cw="$5" ch="$6"
  local tmp_html; tmp_html="$(mktemp -t storeshot).html"
  # The capture is referenced by absolute file:// URL; Chrome is run with
  # --allow-file-access-from-files so the local image loads.
  cat > "$tmp_html" <<HTML
<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${cw}px; height:${ch}px; background:${BG}; overflow:hidden; }
  .panel { width:${cw}px; height:${ch}px; display:flex; flex-direction:column;
           align-items:center; background:${BG}; }
  .headline {
    flex:0 0 auto; width:82%; padding:${HEAD_PAD}px 0 0;
    font-family:"Arial Rounded MT Bold","SF Pro Rounded",-apple-system,sans-serif;
    color:${INK}; text-align:center; line-height:1.18;
    font-size:${HEAD_SIZE}px; letter-spacing:-0.5px;
    text-wrap:balance;
  }
  /* The capture is cropped at the top (negative offset inside a clipping box)
     rather than scaled, so the app's pixels stay 1:1 crisp. */
  .shotbox { flex:1 1 auto; width:100%; display:flex; justify-content:center;
             align-items:flex-end; overflow:hidden; }
  .clip { overflow:hidden; width:${SHOT_W}px; height:${SHOT_H}px; }
  .clip img { display:block; width:${SHOT_W}px; margin-top:-${crop}px; }
</style></head><body>
  <div class="panel">
    <div class="headline">${headline}</div>
    <div class="shotbox"><div class="clip"><img src="file://${raw}"></div></div>
  </div>
</body></html>
HTML
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --virtual-time-budget=1500 \
    --window-size="${cw},${ch}" --screenshot="$out" "file://$tmp_html" >/dev/null 2>&1
  rm -f "$tmp_html"
  [ -s "$out" ] || { echo "!! Chrome produced nothing for $out" >&2; return 1; }
}

DEVICES=()
if [ "$#" -gt 0 ]; then DEVICES=("$@"); else
  for d in "$IN_DIR"/*/; do [ -d "$d" ] && DEVICES+=("$(basename "$d")"); done
fi

mkdir -p "$OUT_DIR"
made=0; skipped=0; unmapped=""
for slug in "${DEVICES[@]}"; do
  src="$IN_DIR/$slug"
  [ -d "$src" ] || { echo "!! no raw captures in $src — skipping" >&2; continue; }
  shopt -s nullglob
  pngs=("$src"/*.png)
  shopt -u nullglob
  if [ "${#pngs[@]}" -eq 0 ]; then
    echo "!! $slug has no PNGs — run the capture step first" >&2; continue
  fi
  dest="$OUT_DIR/$slug"; rm -rf "$dest"; mkdir -p "$dest"
  crop="$(crop_for "$slug")"
  echo "==> $slug  (cropping ${crop}px of header)"
  for raw in "${pngs[@]}"; do
    base="$(basename "$raw" .png)"
    head="$(headline_for "$base")"
    if [ -z "$head" ]; then
      echo "    !! $base : NO HEADLINE MAPPED" >&2
      unmapped="$unmapped $base"; skipped=$((skipped+1)); continue
    fi
    # Canvas = the capture's native pixel size, which already equals Apple's
    # required size for these two devices (6.9\" iPhone 1320x2868, 13\" iPad
    # 2064x2752). Verified with sips below rather than assumed.
    cw="$(sips -g pixelWidth  "$raw" | awk '/pixelWidth/{print $2}')"
    ch="$(sips -g pixelHeight "$raw" | awk '/pixelHeight/{print $2}')"
    # Headline band gets ~19% of the canvas; the capture keeps the rest.
    HEAD_SIZE=$(( cw * 58 / 1000 ))
    HEAD_PAD=$(( ch * 45 / 1000 ))
    SHOT_W=$(( cw * 88 / 100 ))
    SHOT_H=$(( ch * 78 / 100 ))
    export HEAD_SIZE HEAD_PAD SHOT_W SHOT_H
    out="$PWD/$dest/$base.png"
    compose_one "$PWD/$raw" "$out" "$head" "$crop" "$cw" "$ch"
    got="$(sips -g pixelWidth -g pixelHeight "$out" | awk '/pixel/{printf "%s ", $2}')"
    echo "    + $base -> ${got}(w h)"
    made=$((made+1))
  done
done

echo ""
echo "==> composed $made panel(s), skipped $skipped, under ./$OUT_DIR/<device>/"
[ "$made" -gt 0 ] || { echo "!! nothing composed" >&2; exit 1; }
# A capture with no headline is a drift between .maestro/screens.yaml and the map
# above, not a thing to shrug at: it silently ships an incomplete store set.
if [ -n "$unmapped" ]; then
  echo "" >&2
  echo "!! FAILED — captures with no headline mapped:$unmapped" >&2
  echo "   Add them to headline_for() in $0, or remove them from the Maestro tour." >&2
  exit 1
fi
