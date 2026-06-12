# Canonical features

The explicit list of behaviors that must never silently disappear. Born 2026-06-11, after the
breath-timer rebuild silently dropped the start/end chimes and nobody noticed until morning
practice. The lesson: our architecture tests the pure logic layers, so refactor losses happen
in the untested UI glue — and "canonical" lived only in heads. **Canonical is explicit, never
implied.**

## The discipline

1. **Capture at spec time.** When a new feature is specced, the spec says what's canonical vs.
   what's iterative-and-might-change. If the user doesn't say, **Claude asks before building**
   ("anything here canonical?"). (User directive, 2026-06-11.)
2. **Canonical can change — explicitly.** Entries are added, amended, or retired by editing
   this file in a commit that says so. Never by a drive-by code change.
3. **Refactors re-verify.** Rebuilding or replacing a component means re-verifying every entry
   that touches it before the work is called done.
4. **The release audit walks this list** (step 0 of docs/release-and-builds.md).
5. **Absences count.** A deliberately missing behavior (see the yoga end-chime) is an entry
   too — it guards against well-meaning "consistency" additions.

Each entry records: the behavior, provenance (who declared it, when), and its **guard** —
`manifest` (this file + audits), `contract test` (pure-layer jest, enforced by the pre-push
hook), or `smoke test` (screen-level wiring test).

---

## Entries

### 1. Non-repeating timers chime at start and end
- **Pranayama/breath:** pressing Start plays the bell-hit (`playStart` — same sound as the
  yoga tab's start); session completion plays the end bell (`playEndChime` / end-bell.wav).
- **Contrast (canonical ABSENCE):** the yoga tab has **no end chime** — it repeats and plays
  transition sounds instead. Do not "fix" this by adding one.
- Provenance: user, 2026-06-11 — "always a start and end sound for pranayama. really for
  timers that don't repeat." (Declared after the rebuild lost both; restored in `6ddf53e`.)
- Guard: manifest; BreathScreen **smoke test planned** (this is UI wiring — pure tests can't
  see it, which is exactly how it got lost).

### 2. The Metronome survives — and is the default pattern
- The original uniform-grid pranayama lives on as the Metronome pattern: one interval, a click
  every N seconds, no phases. It exists, it is first in the library, and it is the default
  selection on a fresh install.
- Provenance: user, 2026-06-09 — "can not lose the metronome" (highest priority in the
  rebuild feedback).
- Guard: **contract test** (`assets/data/__tests__/canonical.test.ts`).

### 3. 4-7-8 is a lock-in practice: fixed counts, not editable
- Counts stay 4/7/8/0 and the pattern exposes no editable fields. Lock-in is the design
  intent (the boundary IS the practice), not a missing feature.
- Provenance: design philosophy (docs/design-pranayama.md, lock-in category) + user
  2026-06-10: "on 4-7-8, lock is correct."
- Guard: **contract test**.

### 4. Library pattern ids are stable
- `metronome`, `box`, `nadi`, `viloma`, `478` — persisted user selections key on these ids;
  renaming one orphans a saved setting.
- Provenance: implementation contract (persistence via `breath_timer_data`), 2026-06-09.
- Guard: **contract test**.

### 5. The audio grid stays uniform in time
- Boundary clicks never reschedule or shift to irregular timing. Accents (the planned
  downbeat work) may vary timbre/level — never timing. Fall-off-and-rejoin is sacred.
- Provenance: the locked design philosophy (docs/design-pranayama.md), 2026-06-02.
- Guard: manifest + design doc (behavioral/aesthetic — verified by ear and design review).

### 6. Breath settings persist across restart
- Pattern selection, per-pattern count edits, session length, click sound, ambience — all
  survive an app restart (key `breath_timer_data`).
- Provenance: built 2026-06-09, relied on daily.
- Guard: manifest; candidate for the BreathScreen smoke test.

---

## Candidates — observed but NOT yet ratified by the user

Promote by moving above with provenance, or strike.

- HIIT start sound (`playHittStart`) on starting a HIIT session.
- Yoga transition + half-mark chime behaviors (and half-mark surviving a pace switch — fixed
  once in `0d0263c`, suggesting it's load-bearing).
- Last-active Pace restored on launch.
- Click sounds preview when the picker wheel settles on them.
