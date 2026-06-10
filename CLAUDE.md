# Timer App Yoga — Claude guide

React Native / Expo iOS app: three tabs — Pranayama (breath timer), Yoga (pose timer + Paces), HIIT.
Live in the App Store as "Timer App Yoga" (bundle id `com.example.timer-app` — a placeholder that
shipped; it is permanent now, do not "fix" it).

**Start here:** read `docs/README.md` — it indexes the project knowledge base (design rationale,
release playbook, build setup, feature history). Those docs are the durable handoff; trust them
over guesses. There is also a live memory directory (machine-local, see docs/README.md).

## Scope

Only the mobile app is in scope (repo root: `app/`, `components/`, `assets/`, `constants/`).
`admin/`, `server/`, `python-api/` (svg-pipeline) are dormant internal tooling — don't touch
unless asked. Sound Lab (audio asset prep) lives OUTSIDE this repo at `../sound-lab/`.

## Conventions

- Branches: `main` canonical · `dev-{feature}` for work · `build-v{version}-ios-submit` for
  releases (merge back to main + tag `v{version}` after submit). One concern per branch.
- TypeScript: zero errors, enforced by a pre-push hook (`npm run install:hooks`). Type
  StyleSheets with explicit interfaces (see yoga-view.tsx) to avoid union-inference errors.
- Tests: `npx jest` — pure-logic layers only (`assets/data/`, `assets/utils/`). Keep new
  domain logic pure and tested; UI components stay thin.
- Theme: GreenTheme (dark `#080B0c`, lime `#CDDC39`, light green `#7CB342`, olive `#689F38`).
  All three tabs must read as one app — shared tokens in `assets/styles/timer-app.tsx` and
  `assets/theme/`; breath tab tokens in `components/breath/breath-theme.ts`.

## Build & verify

- Type check: `npx tsc --noEmit` · Tests: `npx jest`
- Run on simulator: `npx expo run:ios` (no signing needed)
- Run on iPhone: `npx expo run:ios --configuration Release --device "iPhone"` — or press ▶ in
  Xcode (`ios/TimerAppYoga.xcworkspace`, scheme Run config is set to Release).
- NEVER `eas build` for testing (cloud credits). Releases: see `docs/release-and-builds.md`.
- User does NOT want dev-client / Metro flows.
