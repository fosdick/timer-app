# Releases & builds

As of 2026-06-10. Two distinct activities: **testing builds** (daily, free, local) and
**App Store releases** (the playbook below).

## Rule: never `eas build` for testing

EAS cloud builds spend credits (they reset monthly) and are unnecessary since local signing was
set up (2026-06-10). Defaults:

- **Simulator** (UI checks, zero signing): `npx expo run:ios`
- **Real iPhone** (audio/haptics/practice): `npx expo run:ios --configuration Release --device "iPhone"`
  — or press ▶ in Xcode (`ios/TimerAppYoga.xcworkspace`); the scheme's Run config is set to
  Release, so ▶ gives the standalone no-Metro app.
- No dev-client / Metro flows — Release builds embed the JS bundle.

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
  gitignored prebuild output — `expo prebuild --clean` would wipe the DEVELOPMENT_TEAM and the
  Release scheme tweak; re-set them if regenerated.

## App Store release playbook

0. **Memory/docs audit** (standing practice since 2026-06-10): hard-verify the memory files and
   these docs against reality — extract checkable claims (branches, flags, counts, statuses),
   test each with real commands, fix stale facts in place. Releases are when stale knowledge
   bites hardest. **Also walk `docs/canonical-features.md`** and verify each entry still holds
   in the build being shipped.
1. Merge the feature branch → `main`; verify tests + `npx tsc --noEmit`.
2. From main cut `build-v{NEW_VERSION}-ios-submit`.
3. Bump the version in BOTH `package.json` and `app.json` (`expo.version`); commit and push.
4. Build — pick one:
   - `eas build --profile production --platform ios --local` (free, same pipeline/credentials,
     fastlane required — it's installed; if it breaks after a brew Ruby upgrade:
     `brew reinstall fastlane`), or
   - `eas build --profile production --platform ios` (cloud, costs credits), or
   - Xcode Product → Archive → Organizer upload (fully Expo-free; manual build numbers).
5. `eas submit --profile production --platform ios` (free regardless of build path).
6. App Store Connect: create the version, What's New, select build, submit for review.
7. After submission: merge the release branch back to main, tag `v{NEW_VERSION}`, delete the
   release branch. (Keeps main from falling behind shipped code — the pre-cleanup failure mode.)

Gotchas: Apple periodically updates the PLA — builds fail with "Apple 403" until accepted at
developer.apple.com. `production` profile has `autoIncrement` (build numbers managed by EAS,
`appVersionSource: remote`). The `release-ios` npm script is stale — don't use it.
