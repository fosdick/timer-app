/**
 * Pranayama Patterns
 *
 * A Pattern is an ordered sequence of phases (e.g., Inhale, Hold, Exhale, Hold,
 * Top Hold, Bottom Hold). Patterns play out on top of a uniform audio grid —
 * the chime cadence does NOT change with the pattern; only the on-screen
 * phase labels do. See `memory/pranayama_patterns_design.md` for the rationale
 * (grid model: audio stays uniform, patterns live on screen, fall-off-and-
 * rejoin is preserved).
 *
 * Each pattern declares its recommended `unitSeconds` (the beatInterval that
 * makes the pattern's short-phase boundaries land on chimes). Long sustains
 * (e.g. Viloma's top/bottom holds) may span multiple chimes; the chime keeps
 * ticking under you while you hold.
 */

export interface PranayamaPhase {
  label: string;
  durationSeconds: number;
}

export interface PranayamaPattern {
  id: string;
  name: string;
  /** The chime cadence (beatInterval) that makes the pattern's short phases
   *  land on chimes. e.g. Viloma's 2s short phases want unit=2. */
  unitSeconds: number;
  phases: PranayamaPhase[];
}

// ─── Viloma ────────────────────────────────────────────────────────────────
//
// Iyengar's Viloma pranayama. Inhale section is N cycles of (inhale-hold) at
// the unit, ending in a long top hold after the last inhale. Then the exhale
// section is N cycles of (exhale-hold) at the unit, ending in a long bottom
// hold after the last exhale. The "level" is determined by N and the lengths
// of the top/bottom holds — Iyengar's advanced form is 4–5 cycles with a 20s
// top hold and 15s bottom hold.
//
// This first level: 4 cycles each side, modest 6s top hold, 4s bottom hold.
// At unit=2s the cycle is 4*4 + 6 + 4*4 + 4 = 42 seconds.

export const VILOMA: PranayamaPattern = {
  id: "viloma",
  name: "Viloma",
  unitSeconds: 2,
  phases: [
    // Inhale section: 4 × (inhale 2s, hold 2s)
    { label: "Inhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    { label: "Inhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    { label: "Inhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    { label: "Inhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    // Top hold after last inhale (full lungs)
    { label: "Top Hold", durationSeconds: 6 },
    // Exhale section: 4 × (exhale 2s, hold 2s)
    { label: "Exhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    { label: "Exhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    { label: "Exhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    { label: "Exhale", durationSeconds: 2 },
    { label: "Hold",   durationSeconds: 2 },
    // Bottom hold after last exhale (empty lungs)
    { label: "Bottom Hold", durationSeconds: 4 },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────

export const getCycleDuration = (pattern: PranayamaPattern): number =>
  pattern.phases.reduce((sum, p) => sum + p.durationSeconds, 0);

export interface PhaseAtTime {
  phase: PranayamaPhase;
  index: number;
  /** Cycle-relative seconds at which this phase started. */
  startTime: number;
  /** Seconds remaining in the current phase (counts down 1/sec). */
  remainingInPhase: number;
}

/**
 * Given a pattern and elapsed seconds within the current cycle, return the
 * phase the practitioner should be in, plus how much of it remains.
 *
 * `timeInCycle` should already be reduced modulo the cycle duration by the
 * caller — this function doesn't loop on its own.
 */
export const getPhaseAtTime = (
  pattern: PranayamaPattern,
  timeInCycle: number,
): PhaseAtTime => {
  let start = 0;
  for (let i = 0; i < pattern.phases.length; i++) {
    const end = start + pattern.phases[i].durationSeconds;
    if (timeInCycle < end) {
      return {
        phase: pattern.phases[i],
        index: i,
        startTime: start,
        remainingInPhase: end - timeInCycle,
      };
    }
    start = end;
  }
  // Edge: timeInCycle === cycleDuration exactly — wrap to the first phase.
  return {
    phase: pattern.phases[0],
    index: 0,
    startTime: 0,
    remainingInPhase: pattern.phases[0].durationSeconds,
  };
};
