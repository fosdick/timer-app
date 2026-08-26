# Timer App Yoga

A React Native / Expo iOS app with three practice tabs — **Pranayama** (breath timer),
**Yoga** (pose timer + Paces), and **HIIT**. Live on the App Store as "Timer App Yoga."

This is the front door. The durable project knowledge lives in **[docs/](docs/README.md)**
(design rationale, release playbook, build setup, feature history); start there for anything
beyond getting it running. `CLAUDE.md` is the guide for AI sessions.

## Get started

```bash
npm install          # installs everything (Node 20+)
npm run ios          # build + run on the iOS simulator (no signing needed)
```

Other day-to-day commands:

```bash
npm test             # jest (watch mode)
npm run typecheck    # tsc --noEmit  (also enforced by a pre-push hook)
npm run lint
```

## Run on your phone (smoke testing)

```bash
npm run ios:device   # Release build straight to a plugged-in iPhone via Xcode
```

No EAS credits, no Metro, no dev client — it embeds the JS bundle. First run on a new phone:
delete any App Store copy first, and enable Developer Mode (Settings → Privacy & Security).

## Build & deploy to the App Store

```bash
npm run preflight    # FIRST — checks toolchain / signing / cert health before a long build
# bump version in BOTH package.json and app.json, commit
npm run build:ios    # free local production build (eas build --local; needs fastlane)
npm run submit:ios   # upload to App Store Connect
```

Then in App Store Connect: create the version, fill What's New, select the build, submit.
**Full step-by-step playbook + signing facts + gotchas:
[docs/release-and-builds.md](docs/release-and-builds.md).**

Notes that keep deploys from rotting between sessions:
- `eas-cli` is **version-pinned in the npm scripts** (`npx eas-cli@<version>`), so it doesn't
  silently change — and it's intentionally *not* a project dependency (expo-doctor flags that).
- The iOS signing team is captured in `app.json` (`ios.appleTeamId`), so `expo prebuild`
  restores `DEVELOPMENT_TEAM` automatically.
- Never run a plain cloud `eas build` for **testing** — it spends credits. `npm run build:ios`
  (`--local`) is free and uses the same pipeline.

## Tech

Expo Router (file-based), TypeScript, jest + React Native Testing Library. Domain logic is kept
pure and tested in `assets/`; UI components stay thin. Behaviors that must never silently
disappear are tracked in [docs/canonical-features.md](docs/canonical-features.md).
