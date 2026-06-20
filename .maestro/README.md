# E2E flows (Maestro)

The end-to-end tier of the test strategy — it drives the **real app on a simulator/device**, so
it sees what a user sees. This is the layer RNTL render tests cannot reach (e.g. the promo
native-clear bug, which passed in RNTL but failed on device). Each flow guards a canonical
behavior from [`docs/canonical-features.md`](../docs/canonical-features.md).

## Flows
| File | Guards |
|---|---|
| `count-in.yaml` | #7 — Pranayama "Begin in" count-in on a fresh start |
| `tab-switch-confirm.yaml` | #6 — running timer gates tab switches behind a confirm |

Next flows to add (incrementally): promo redeem clears the field (#5, the money path — needs an
accessibility label on the header settings icon to be tappable), start/end chimes.

## Run it

1. Install Maestro (pulls a JDK):
   ```bash
   brew install mobile-dev-inc/tap/maestro
   ```
2. Get the app onto a simulator (boots one and installs):
   ```bash
   npm run ios          # or: npx expo run:ios
   ```
3. Run the flows:
   ```bash
   npm run e2e          # = maestro test .maestro
   ```

`appId` in each flow is `com.example.timer-app` (the shipped bundle id). Maestro targets the
booted simulator automatically. iOS physical-device support is limited — prefer a simulator.

## Status & gotchas (2026-06-20)

- **`count-in.yaml` passes** green on a Release simulator build. The pipeline works.
- **Java:** macOS ships a `/usr/bin/java` *stub* that only nags you to install Java, so naive
  detection is misleading. `scripts/e2e.sh` (what `npm run e2e` runs) resolves a real JDK
  (`/usr/libexec/java_home`, else a Temurin JDK under `~/.jdks`) and prepends it to PATH. It also
  puts `~/.maestro/bin` on PATH, since npm scripts don't source your interactive shell.
- **Cold-launch timing:** assert right after `launchApp` and you'll race the splash. Each flow
  first does `extendedWaitUntil: { visible: "Start" }` to wait for first render.
- **Tab labels aren't matchable text on iOS.** To tap a tab, use its `testID`
  (`tab-pranayama` / `tab-yoga` / `tab-hitt`, set via `tabBarButtonTestID` in
  `app/(timer-app)/_layout.tsx`), not the visible label. `tab-switch-confirm.yaml` uses
  `tapOn: { id: tab-yoga }` — it goes green on any build that includes those testIDs.

