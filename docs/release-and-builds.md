# Releases & builds

As of 2026-06-10. Two distinct activities: **testing builds** (daily, free, local) and
**App Store releases** (the playbook below).

## Rule: never `eas build` for testing

EAS cloud builds spend credits (they reset monthly) and are unnecessary since local signing was
set up (2026-06-10). Defaults (npm scripts wrap these — see README-deploy.md):

- **Preflight first** (after time away): `npm run preflight` — checks toolchain/signing/cert rot
  before a long build fails on it.
- **Simulator** (UI checks, zero signing): `npm run ios` (`npx expo run:ios`)
- **Real iPhone** (audio/haptics/practice): `npm run ios:device`
  (`npx expo run:ios --configuration Release --device`) — or press ▶ in Xcode
  (`ios/TimerAppYoga.xcworkspace`); the scheme's Run config is set to Release, so ▶ gives the
  standalone no-Metro app.
- No dev-client / Metro flows — Release builds embed the JS bundle.
- **`eas-cli` is pinned** as a devDependency (run via the npm scripts, not bare `npx`), so the
  CLI doesn't silently change version between sessions.

## Local signing facts (hard-won, don't re-derive)

- The **paid Apple developer team is `L5MB3YYG22` ("Jarvis Fosdick"), owned by jarvis@fastmail.fm**
  — NOT jarvis1@fastmail.fm (Jarvis has several Apple IDs; jarvis1 logs into the dev website but
  the membership is under jarvis@). Recover the team from any EAS ipa:
  `unzip -p build.ipa 'Payload/*.app/embedded.mobileprovision' | strings | grep -A2 TeamIdentifier`.
- Bundle id `com.example.timer-app` is the shipped production id — permanent, never change it.
- In Xcode's Team dropdown, "(Personal Team)" entries are free provisioning teams — pick the
  entry WITHOUT that suffix.
- `expo run:ios` invokes xcodebuild WITHOUT `-allowProvisioningUpdates`: the FIRST build on a
  fresh machine needs direct xcodebuild with `-allowProvisioningUpdates
  -allowProvisioningDeviceRegistration`, or one ▶ run in the Xcode GUI.
- CLI codesign from background shells can fail with `errSecInternalComponent` (keychain won't
  release the key without a GUI prompt). The Xcode GUI ▶ is the reliable path.
- First dev install: DELETE the App Store copy first (distribution→development profile can't
  overwrite; wipes local app data), and the phone will require Developer Mode (Settings →
  Privacy & Security, restart).
- Always open `ios/TimerAppYoga.xcworkspace` (not the .xcodeproj, not the folder). `ios/` is
  gitignored prebuild output. The **DEVELOPMENT_TEAM is now captured in `app.json`**
  (`ios.appleTeamId: "L5MB3YYG22"`), so `expo prebuild` re-applies it automatically — a clean
  prebuild no longer drops signing. The Release **scheme tweak** is NOT yet captured in config,
  so re-set that one by hand if `ios/` is regenerated (or do one ▶ run in Xcode).

## App Store release playbook

0. **Memory/docs audit** (standing practice since 2026-06-10): hard-verify the memory files and
   these docs against reality — extract checkable claims (branches, flags, counts, statuses),
   test each with real commands, fix stale facts in place. Releases are when stale knowledge
   bites hardest. Also walk `docs/canonical-features.md` and verify each entry holds in the
   build being shipped.
1. Merge the feature branch → `main`; verify tests + `npx tsc --noEmit`.
2. From main cut `build-v{NEW_VERSION}-ios-submit`.
3. Bump the version in BOTH `package.json` and `app.json` (`expo.version`); commit and push.
4. Build — pick one:
   - `npm run build:ios` (= `eas build --profile production --platform ios --local`) — free, same
     pipeline/credentials, fastlane required — it's installed; if it breaks after a brew Ruby
     upgrade: `brew reinstall fastlane`), or
   - `eas build --profile production --platform ios` (cloud, costs credits), or
   - Xcode Product → Archive → Organizer upload (fully Expo-free; manual build numbers).
5. `npm run submit:ios` (= `eas submit --profile production --platform ios`) — free regardless of
   build path.
6. App Store Connect: create the version, What's New, select build, submit for review.
7. After submission: merge the release branch back to main, tag `v{NEW_VERSION}`, delete the
   release branch. (Keeps main from falling behind shipped code — the pre-cleanup failure mode.)

Gotchas: Apple periodically updates the PLA — builds fail with "Apple 403" until accepted at
developer.apple.com. `production` profile has `autoIncrement` (build numbers managed by EAS,
`appVersionSource: remote`). (The old stale `release-ios` npm script was removed 2026-06-19 —
use `npm run build:ios` / `npm run submit:ios`.)

### `eas build --local` fails in "Install dependencies" with "Unknown error" (2026-06-19)

Any `--local` EAS build (preview or `production`) tarballs the working dir **without `.git/`**,
then runs `npm ci`. npm's `prepare` lifecycle script fires automatically during that install —
ours runs `install:hooks`, which `cp`s a hook into `.git/hooks/`. In the sandbox `.git/hooks`
doesn't exist, the `cp` fails, and EAS masks the real cause as a generic "Unknown error. See logs
of the Install dependencies build phase." The fix: `install:hooks` now guards on
`test -d .git/hooks` and `|| true`s, so it no-ops when there's no git checkout. Don't drop the
guard. (Same trap would bite any new `prepare`/`postinstall` script that assumes `.git/` or other
dev-only files are present.)
