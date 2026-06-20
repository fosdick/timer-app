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

## Caveat (not yet green — known, scoped follow-up)

These flows are written and the Maestro pipeline runs, but they are **not yet passing on a build
produced by `npx expo run:ios`**. That build launches through **`expo-dev-client`** (it's a
dependency), so a `launchApp: { clearState: true }` wipes the saved dev-server URL and the app
opens the **dev-client launcher** instead of the Pranayama tab — the first `assertVisible` fails.

To get a clean green run, build the app **without the dev-client launcher in the path** (a
standalone test build), then run `npm run e2e`. That's the next E2E task. The flows themselves
(selectors, steps, `clearState` for a fresh sequence) are correct for a standalone build.

