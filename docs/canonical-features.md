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
- **Pranayama/breath:** the start bell-hit (`playStart` — the same sound as the yoga tab's start)
  marks the beginning of the practice; session completion plays the end bell (`playEndChime`,
  end-bell.wav).
- **Amended 2026-06-19 (count-in, #7):** on a FRESH sequence the start bell now fires when the
  count-in reaches 0 (not on the button press); on resume from a pause it still fires
  immediately. The bell still marks the actual start of breathing — that intent is unchanged.
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

### 5. The promo-code field clears after Apply, on every outcome
- After pressing Apply the text input clears — valid, unrecognized, or already-active alike —
  and the feedback line reports what happened. The field never lingers with stale text.
- Provenance: user, 2026-06-19 — ratified "promo-clear". Regressed TWICE: first the clear was
  missing; then the success path cleared in React state but lingered on-device because the field
  was disabled (`editable={!busy}`) in the same render that cleared it, stranding the native iOS
  text update. Fix: don't disable the field during activation; re-entry guarded in handleApply.
- Guard: **smoke test** (`components/__tests__/promo-code-input.test.tsx`, RNTL) covers the state
  clear + "field stays editable while activation is in flight". CAVEAT: the native-reconciliation
  variant is below RNTL's mock renderer (it only sees React state) — that layer needs device/E2E.

### 6. A running timer gates tab switches behind a confirmation
- While any timer is running, switching tabs prompts "switch anyway?" first — an accidental tap
  (phone set down mid-practice) must not silently stop the session. Idle → instant switch as
  before; pressing the already-focused tab never prompts.
- Provenance: user, 2026-06-19 — "if timer is running confirm to continue switching"; ratified
  "tab switch confirm".
- Guard: **contract test** (`assets/utils/__tests__/tab-switch-guard.test.ts`) for the decision
  + **smoke test** (`components/__tests__/active-timer-context.test.tsx`) for the running-state
  plumbing.

### 7. Count-in ("Begin in") on the Pranayama tab
- Pressing Start on a FRESH sequence counts in from 8 seconds, labeled "Begin in"; when it
  reaches 0 the start chime plays and the existing functionality begins. Does NOT run on
  pause/resume (resume starts immediately). Pressing Stop during the count-in cancels it. The
  count-in counts as an active session (tab-switch guard + controls locked apply during it).
  Pranayama tab only — yoga/HIIT have no count-in.
- Provenance: user, 2026-06-19 — "create a 'count in' feature... 'count in' from 10 seconds.
  Label the counter as 'Begin in'. when the counter reaches 0, start chime plays and the existing
  functionality begins. This only happens from the beginning of a new breathe sequence. does not
  happen on a pause / resume case." (Duration amended 10 → 8 at ratification, same day.)
- Guard: **smoke test** (`components/breath/__tests__/BreathScreen.canonical.test.tsx`).

---

## Nominees — observed by Claude, NOT yet ratified

Promote with the user's words, or strike.

- **App Support stays reachable** — it's an Apple App Store requirement. Lives on the App Settings
  page (header user menu → App Settings), alongside the promo code and purchases. Never remove it.
  (Provenance: user, 2026-06-20 — "app support is a requirement for Apple app store, can not lose
  that.") Guard: manifest (release audit) + the menu render test reaches App Settings.
- Header **account menu**: a user glyph opens a dropdown with "User Preferences" and
  "App Settings"; App Settings is the existing settings page. (Provenance: user, 2026-06-20.)
  Guard: **smoke test** (`components/__tests__/user-menu.test.tsx`) — opens + both links resolve.
- **Downbeat snap** (Pranayama): a per-pattern toggle plays the selected downbeat sound on each
  count of EVERY phase — inhale, retention, exhale, retention — a pulse on the EXISTING count
  grid (no new beats; honors #4).
  Viloma defaults ON, every other non-metronome pattern OFF; metronome has no downbeats. The
  downbeat sound + per-pattern enablement persist. (Provenance: user, 2026-06-20 — "play the
  downbeat/snap sound on each count during the inhale & exhale... on the existing grid — not
  adding new beats"; "Viloma by default has downbeats enabled... all the others are default off.
  excludes metronome.") Guard: **contract test**
  (`assets/data/__tests__/breath-timer-core.test.ts`, downbeatBeats/downbeatsBetween).
- The Start/Stop button is **bottom-anchored and fixed in place**, in the same spot across all
  three tabs (Pranayama / Yoga / HIIT) and above the banner ad. Tab content must scroll rather
  than push the button off-screen or behind the ad. (Provenance: user, 2026-06-20 — "make the
  start button fixed… place of start, so it matches all tabs in canonical." Surfaced when
  Visamavritti's controls pushed Start behind the banner; fixed by scrolling the controls.)
- Library pattern ids stay stable (`metronome/box/nadi/viloma/478`) — persisted selections
  key on them.
- Breath settings persist across restart (pattern, count edits, length, click, ambience —
  key `breath_timer_data`).
- HIIT start sound (`playHittStart`) on starting a HIIT session.
- Last-active Pace restored on launch (yoga tab).
- Click sounds preview when the picker wheel settles on them.
- Pranayama session length always ends on an EXHALE. Selecting a countdown time or editing the
  counts auto-adjusts the total UPWARD (never below the selected time) so the session ends at the
  end of an exhale phase — any trailing retention of the final cycle is dropped. Nadi Shodhana
  rounds to whole ROUNDS (2 sets, alternating nostrils): the round ends on set 2's exhale.
  Metronome is unaffected (no exhale phase). (Bug/feature nomination — provenance: user,
  2026-06-20: "auto adjust the total count down time so that the end is always on an exhale. Time
  will always adjust upward... a round is the 2 sets... the final ending should always be
  exhale.") Guard: **contract test** (`assets/data/__tests__/breath-patterns.test.ts`,
  adjustTotalToExhaleEnd).
- Creating a new Pace (yoga tab) LOADS it but does NOT start the timer — matches selecting an
  existing pace (handleApplyPace) and the hamburger "Save as Pace" path. The center-icon
  create-while-a-flow-is-running path used to leave the timer running into the new pace; fixed
  2026-06-20 by stopping (cancelHalfwayPauseAndStop) before applying, like pace selection.
  (Bug-fix nomination — provenance: user, 2026-06-20: "desired behavior is to not have the flow
  start when the user saved a new flow.") Guard: TBD (E2E flow or YogaView wiring test).
- Visamavritti exists right after 4-7-8 with all four counts independently editable,
  defaulting to the 1:4:2:3 ratio (4/16/8/12). (Nominated at its go moment, 2026-06-12 —
  user words on file: "this style requires all four box... the default should be the ratio
  of 1:4:2:3"; awaiting explicit ratification.)
