# Canonical features

The explicit list of behaviors — and deliberate absences — that must never silently disappear.

Born 2026-06-11: the breath-timer rebuild silently dropped the start/end chimes, and it took
morning practice to notice. The architecture tests the pure-logic layers, so refactor losses
happen in the untested UI glue — and "canonical" lived only in the maker's head. This file is
the missing ladder step.

## The discipline

1. **Canon is captured at the go moment.** When a feature gets its "go", Claude confirms:
   "canonical bits I'm hearing: X, Y — confirm?" The builder knows at creation time what's
   settled vs. what will iterate; that knowledge is cheap to extract in the moment and
   ridiculous to reconstruct later. Feature-scoped — bug fixes skip the ritual.
2. **Entries are in the user's voice.** Every entry carries provenance (quote + date). Claude
   may *nominate*; only the user ratifies. This keeps the list small and sacred rather than
   comprehensive and dead.
3. **No retroactive sweep.** The list grows at go moments — and when practice trips on a
   missing step (that's the exception net, not the mechanism).
4. **Canonical can change — explicitly.** Amend this file in a commit that says so. A failing
   canonical test is a question ("did you mean to change canon?"), not a wall: amend the
   manifest in the same commit, or stop.
5. **Absences count.** A deliberately missing behavior is an entry too — negative space is
   what well-meaning "consistency" additions destroy.
6. **Refactors re-verify.** Rebuilding or replacing a component means re-verifying its entries
   before the work is called done. The release audit (step 0, docs/release-and-builds.md)
   walks this list.

Guard tiers: `manifest` (this file + audits) → `contract test` (pure-layer jest, pre-push
enforced) → `smoke test` (screen-level wiring test — the layer where losses actually happen).

---

## Ratified

### 1. Non-repeating timers chime at start and end
- **Pranayama/breath:** pressing Start plays the bell-hit (`playStart` — the same sound as the
  yoga tab's start); session completion plays the end bell (`playEndChime`, end-bell.wav).
- **Canonical ABSENCE:** the yoga tab has **no end chime** — it repeats and plays transition
  sounds instead. Do not "fix" this by adding one.
- Provenance: user, 2026-06-11 — "always a start and end sound for pranayama. really for
  timers that don't repeat." (Declared after the rebuild lost both; restored in `6ddf53e`.)
- Guard: **smoke test** (`components/breath/__tests__/BreathScreen.canonical.test.tsx`) —
  this is UI wiring; pure tests can't see it, which is exactly how it got lost.

### 2. The Metronome survives — and is the default pattern
- The original uniform-grid pranayama lives on as the Metronome pattern: one interval, a click
  every N seconds, no phases. It exists, is first in the library, and is the default selection.
- Provenance: user, 2026-06-09 — "can not lose the metronome."
- Guard: **contract test** (`assets/data/__tests__/canonical.test.ts`).

### 3. 4-7-8 is a lock-in practice: fixed counts, not editable
- Counts stay 4/7/8/0; the pattern exposes no editable fields. Lock-in is the design intent
  (the boundary IS the practice), not a missing feature.
- Provenance: design philosophy (docs/design-pranayama.md) + user, 2026-06-10: "on 4-7-8,
  lock is correct."
- Guard: **contract test**.

### 4. The audio grid stays uniform in time
- Boundary clicks never reschedule or shift to irregular timing. Accents (the planned downbeat
  work) may vary timbre/level — never timing. Fall-off-and-rejoin is sacred.
- Provenance: the locked design philosophy (docs/design-pranayama.md), 2026-06-02.
- **Held loosely (user, 2026-06-11):** "we may have to change the audio locked grid. i'm not
  sold on that exactly — there was talk of an aperiodic grid, more like a tessellation or
  fractal." Stands for the upcoming release; expect an explicit amendment if the
  aperiodic/fractal direction lands post-release.
- Guard: manifest + design doc (behavioral/aesthetic — verified by ear and design review).

---

## Nominees — observed by Claude, NOT yet ratified

Promote with the user's words, or strike.

- Library pattern ids stay stable (`metronome/box/nadi/viloma/478`) — persisted selections
  key on them.
- Breath settings persist across restart (pattern, count edits, length, click, ambience —
  key `breath_timer_data`).
- HIIT start sound (`playHittStart`) on starting a HIIT session.
- Last-active Pace restored on launch (yoga tab).
- Click sounds preview when the picker wheel settles on them.
