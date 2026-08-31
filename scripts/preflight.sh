#!/usr/bin/env bash
#
# iOS build/deploy preflight.
#
# Run `npm run preflight` when you come back to the project after a while. It
# surfaces the things that rot between sessions — floating toolchain, missing
# fastlane, an unset signing team, expired certs/profiles — BEFORE a 15-minute
# build fails on them. Informational; exits non-zero only on a blocking issue.
#
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
bad()  { printf "  \033[31m✗\033[0m %s\n" "$1"; fail=1; }

echo "── iOS build/deploy preflight ─────────────────────────────"

# 1. eas-cli is pinned to an exact version in the build:ios/submit:ios scripts
# (npx eas-cli@<version>) — NOT installed as a project dep (expo-doctor flags that),
# and NOT bare `npx eas` (which floats to latest each session).
easpin=$(node -e "const s=require('./package.json').scripts['build:ios']||''; const m=s.match(/eas-cli@([0-9.]+)/); process.stdout.write(m?m[1]:'')")
if [ -n "$easpin" ]; then
  ok "eas-cli pinned via npx in scripts: $easpin (deploy with 'npm run build:ios' / 'submit:ios')"
else
  bad "eas-cli version not pinned in build:ios script — pin it as 'npx eas-cli@<version>'"
fi

# 2. fastlane — required by 'eas build --local'.
if command -v fastlane >/dev/null 2>&1; then
  flver=$(fastlane --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  ok "fastlane present${flver:+: $flver}"
else
  warn "fastlane not found — 'npm run build:ios' (--local) needs it. Install: 'brew install fastlane'"
fi

# 3. Signing team must live in app.json (so prebuild restores DEVELOPMENT_TEAM).
team=$(node -e "try{process.stdout.write(require('./app.json').expo.ios.appleTeamId||'')}catch(e){}")
if [ -n "$team" ]; then
  ok "appleTeamId in app.json: $team (prebuild writes this into the Xcode project)"
else
  bad "appleTeamId missing from app.json — prebuild won't set the signing team"
fi

# 4. Native project present (else a prebuild is needed first).
if [ -d ios ]; then
  ok "ios/ present"
else
  warn "ios/ missing — run 'npx expo prebuild -p ios' (team comes from app.json above)"
fi

# 5. Codesigning identities in the keychain (footer line: "N valid identities found").
ids=$(security find-identity -v -p codesigning 2>/dev/null | awk '/valid identities found/{print $1}')
if [ "${ids:-0}" -gt 0 ] 2>/dev/null; then
  ok "codesigning identities in keychain: $ids"
else
  warn "no codesigning identities found — open Xcode once and sign in to your Apple account"
fi

# 6. Provisioning profile expiry — flag any already expired (best-effort).
profdir="$HOME/Library/MobileDevice/Provisioning Profiles"
if [ -d "$profdir" ] && ls "$profdir"/*.mobileprovision >/dev/null 2>&1; then
  expired=0
  for p in "$profdir"/*.mobileprovision; do
    exp=$(security cms -D -i "$p" 2>/dev/null | plutil -extract ExpirationDate raw - 2>/dev/null || true)
    [ -n "$exp" ] || continue
    # ISO date compare; profiles in the past are stale.
    if [ "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \> "$exp" ]; then expired=$((expired+1)); fi
  done
  if [ "$expired" -gt 0 ]; then
    warn "$expired provisioning profile(s) expired — Xcode auto-renews on the next signed build"
  else
    ok "provisioning profiles look current"
  fi
fi

# 7. Expo environment doctor (versions, native module mismatches, etc.).
echo "── expo-doctor ────────────────────────────────────────────"
if npx --yes expo-doctor; then
  ok "expo-doctor clean"
else
  warn "expo-doctor reported issues (above) — worth resolving before a release"
fi

# 8. Screenshot mode must be OFF for anything you intend to ship. A build made
# with EXPO_PUBLIC_SCREENSHOT_MODE=1 has ads disabled for EVERY user, with nothing
# in the UI to reveal it — the failure would be silent and revenue-shaped.
echo "── screenshot mode ────────────────────────────────────────"
sm_on=0
[ "${EXPO_PUBLIC_SCREENSHOT_MODE:-}" = "1" ] && sm_on=1
for f in .env .env.local .env.production; do
  [ -f "$f" ] && grep -qE '^[[:space:]]*EXPO_PUBLIC_SCREENSHOT_MODE[[:space:]]*=[[:space:]]*1' "$f" && sm_on=1
done
if [ "$sm_on" -eq 1 ]; then
  bad "EXPO_PUBLIC_SCREENSHOT_MODE=1 is set — a build from here would ship with ads OFF"
else
  ok "screenshot mode off (ads will display normally)"
fi

echo "───────────────────────────────────────────────────────────"
if [ "$fail" -ne 0 ]; then
  echo "✗ preflight found blocking issues — fix the ✗ lines before building."
  exit 1
fi
echo "✓ preflight passed (review any ! warnings)."
