# Project state snapshot

As of 2026-06-10. The most perishable doc here — verify against `git log` and the code before
trusting details.

## Released

**v1.0.6 live in the App Store** (shipped ~2026-06-02). Shipped WITHOUT yoga-flow.
Merged to main since then (unreleased): Paces, promo codes, type-safety cleanup, the
Viloma+ocean pranayama iteration (since superseded on dev-breath-timer).

## Branches

- `main` — canonical, everything shippable through the 2026-06-03 deconcentration batch.
- `dev-breath-timer` — ACTIVE: the breath-timer rebuild (see breath-timer.md). Next release
  candidate once practice-testing settles.
- `dev-paces` / tag `backup-dev-paces-pre-split` — old kitchen-sink backup, deletable when
  comfortable. `dev-pranayama` — the pre-rebuild pranayama line (old component's last state).

## Feature flags & dormant work

- `YOGA_FLOW_ENABLED = false` in `constants/constants.tsx` — yoga-flow paused; v2 WIP preserved
  at tag `yoga-flow-v2-wip`. NOTE: the center icon now opens Paces, so re-enabling needs a UX
  rethink for the entry point.
- Old pranayama (`components/pranayama.tsx`): intact but unrouted — holds the Viloma+ocean
  long-hold treatment (Sanskrit labels, hold-only ambience, progress bar) that may inform the
  new screen's future "ambience during holds only" option.
- `assets/data/hold-ambiences.ts` — the old component's bed catalog; the new screen has its own
  in `components/breath/breath-sounds.ts`.

## Features in the shipped/merged app

- **Paces** (yoga tab): saveable named timer presets, full CRUD, swipe edit/delete, last-active
  restored on launch. Center pose icon opens the Pace list.
- **Promo codes** (settings): first promo `flowfree` → remove ads; designed for more.
- **Pre-push tsc hook**: `scripts/git-hooks/pre-push`, installed via `npm run install:hooks`.

## Sound Lab (`../sound-lab/` — separate, LOCAL-ONLY git repo)

3-tier audio asset workshop (React/Vite ui :5173 → Express :3010 → FastAPI+ffmpeg+pyloudnorm
:8010). Renders seamless, loudness-tuned WAV loops; syncs into `assets/sounds/`. Run via
`sound-lab/start.sh` + GUIDE.md. Recipe holds the whole app sound family (12 beds incl.
imported clicks/bells). Key facts: the click (`snap.wav`) is the loudness anchor; app sounds are
wired via the registry `assets/utils/sounds.tsx` (renames are dangerous); known issue —
`end-bell.wav` peaks at 0 dBFS (clipping). Strong next feature idea: live "seam score" while
dragging in/out points. **No remote — back it up before any machine change.**

## Known issues / deferred

- Settings gear (and native back arrow) show an iOS system bar-button capsule ("white
  background") — needs a device screenshot, then a native-header fix. Not our SVG.
- `components/__tests__/ThemedText-test.tsx` snapshot fails in the test env — pre-existing Expo
  template drift, not a regression; delete or fix someday.
- Disk: the Mac is ~97% full (a 10.6 GB iOS simulator platform download didn't help).

## Claude housekeeping

- Permission allowlists: project `.claude/settings.json` (curated read-only verify loop) +
  `.claude/settings.local.json` (large, organically grown; ~half is dead one-shot entries —
  prunable). Esc interrupts Claude any time; deny isn't the stop button.
- Live memory + docs relationship: see [README.md](README.md). Jarvis plans to possibly cancel
  his personal Claude plan after the next release — these docs are the prep for that;
  canceling (vs deleting) keeps claude.ai history and all local Claude Code state.
