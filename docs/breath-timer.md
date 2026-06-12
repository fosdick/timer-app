# Breath timer (the new pranayama tab)

State as of 2026-06-10, branch `dev-breath-timer` (~28 commits ahead of main, pushed, NOT merged).
A generalized breath-pattern timer, sketch-driven rebuild replacing the old single-Viloma
pranayama component. Design rationale: see [design-pranayama.md](design-pranayama.md).

## Architecture (layered, pure-logic-first, unit-tested)

- `assets/data/breath-patterns.ts` — pure model. `BreathPattern` = four phase counts
  (inhale / holdIn / exhale / holdOut; 0 = skipped). Library: METRONOME (the original uniform
  grid, default selection, highest-priority to preserve), BOX 4/4/4/4, NADI_SHODHANA 10/2/10/2
  (`splitHolds: true` → independent retention edits), VILOMA 16/6/16/4, FOUR_SEVEN_EIGHT 4/7/8/0
  (`locked` — lock-in category, intentionally not editable), VISAMAVRITTI 4/16/8/12
  (`independentCounts: true` → all four boxes edit separately; the classical 1:4:2:3
  unequal-breath ratio). Pure helpers: resolvePhases,
  buildTimeline (click segment in its own ~0.3s container + breath segment per phase),
  editableFields / countFields (field shape derives from the LIBRARY pattern's symmetry, not
  live values — the "Viloma bug" fix), applyCountEdit, segmentAtElapsed.
- `assets/data/breath-timer-core.ts` — pure engine: clicksBetween (boundary clicks in a tick
  window, correct across cycle loops), breathView (full display state at any elapsed time).
- `assets/utils/use-breath-timer.ts` — thin hook: 100ms ticker, wall-clock elapsed (drift-free),
  fires onClick per boundary.
- `assets/utils/use-ambience.ts` — looping bed lifecycle (createAsync isLooping — the verified
  seamless player method).
- `components/breath/` — BreathScreen (assembly + persistence under key `breath_timer_data`),
  BreathStage (countdown shares the yoga tab's typography; fixed-height center so controls never
  shift), CountEditors (single merged count row: tap-to-edit scroll wheels + live phase highlight;
  display-only boxes for locked 4-7-8), PatternPicker, WheelSelect (generic pure-JS scroll-wheel
  modal — no native picker dependency), SoundOptions (Click + Ambience wheels; click previews on
  wheel settle), breath-sounds.ts (catalogs), breath-theme.ts (tokens from the app theme).
- Wired in at `app/(timer-app)/index.tsx`. The OLD `components/pranayama.tsx` (Viloma + ocean
  long-hold treatment, Antara/Bahya Kumbhaka labels) is untouched in the repo and recoverable.

Tests: `assets/data/__tests__/breath-patterns.test.ts` + `breath-timer-core.test.ts` — 100+ Jest
tests on the pure layers. UI stays thin and untested by design.

## Vocabulary

"Hold" is called **Retention** everywhere user-facing (count boxes, running phase label,
4-7-8 display). Sanskrit naming (Antara/Bahya Kumbhaka) was used in the OLD component and may
return as decorative labels.

## Iteration log (compressed)

1. **2026-06-09** — foundation: pure model + engine + hook + UI; routed into the tab.
2. Same day — metronome mode (preserve the original pranayama, "can not lose the metronome"),
   editable counts via scroll wheels, session-length picker, sound options, GreenTheme match.
3. **2026-06-10** — screenshot-driven fixes: merged duplicate count rows (the editable row IS
   the live display), wheel-select for sounds (chips didn't scale), new Sound Lab ambience set
   (None/Ocean/Waves/Sailboat/Wind/Fire/Nature), Viloma edit-shape bug fix, layout fits.
4. Same day — cross-tab unification: light green `#7CB342` replaces the blue-gray on the breath
   tab; Stop/Resume button states light-green on ALL tabs (`startButtonEngaged`); countdown
   matches yoga typography; Start bottom-anchored in the shared buttonContainer; HH:MM:SS with
   leading zeros + hours in the picker; Retention naming; Nadi 3-box edits.
5. Audio: nature-tak and meditative-ocean loops had real seams (cut mid-waveform) — fixed with
   0.5s end-into-start crossfades in place; proper Sound Lab re-renders can supersede. The
   player method was verified correct.

## Open before release (user's judgment pending)

- More practice-testing of the new screen (it replaced the proven old pranayama).
- Whether ambience should play whole-session (current) vs only during long holds (the old
  component's behavior).
- Click slot length / click fade as tunables; end-of-cycle softer chime; visual breathing cue;
  patterns library with levels — all deferred, see design doc.
- The release itself: merge dev-breath-timer → main, then the release playbook
  ([release-and-builds.md](release-and-builds.md)).
