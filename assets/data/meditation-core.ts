/**
 * Meditation session logic. Pure — no React, no timers, no audio.
 *
 * A session runs: SETTLING (silence, so you arrive rather than react to a start)
 * -> a bell -> SITTING (progress chimes at marks) -> closing bells -> finished.
 *
 * Shaped deliberately unlike the breath timer even though they look similar. A
 * breath session is driven by COUNTS; a sit is driven by the clock, and the
 * screen is meant to be ignorable — the bells carry it. That is why nothing here
 * returns a per-phase count.
 *
 * The cue discipline is inherited from a real bug: the Pranayama timer used to
 * fire a phase cue and the finishing cue on the same tick, so the two sounds
 * overlapped at the end of a session. The rule that fixed it applies here too —
 * compute the view first, and let the finishing tick own the audio alone.
 */

export type MeditationPhase = "settling" | "sitting" | "closing" | "finished";

export interface MeditationConfig {
  /** Whole session including settling, in seconds. */
  totalSec: number;
  /** Silence before the opening bell. Arrive, don't react. */
  settleSec: number;
  /** How many evenly spaced progress chimes during the sit. 0 = none. */
  intervals: number;
  /** Seconds of the tail reserved for the closing bells. */
  closingSec: number;
}

export const DEFAULT_MEDITATION: MeditationConfig = {
  totalSec: 600,
  settleSec: 10,
  intervals: 3,
  closingSec: 15,
};

export interface MeditationView {
  phase: MeditationPhase;
  /** Seconds since the session began, clamped to totalSec. */
  elapsed: number;
  /** Seconds left in the whole session. */
  totalRemaining: number;
  /** 0..1 across the SITTING portion only — what the lotus follows. */
  progress: number;
  /** Set on the tick that crosses a mark; null otherwise. */
  cue: MeditationCue | null;
  finished: boolean;
}

export type MeditationCue = "open" | "interval" | "close";

/** The absolute second marks at which each cue fires. */
export function cueMarks(c: MeditationConfig): { at: number; cue: MeditationCue }[] {
  const marks: { at: number; cue: MeditationCue }[] = [{ at: c.settleSec, cue: "open" }];
  const sitStart = c.settleSec;
  const sitEnd = Math.max(sitStart, c.totalSec - c.closingSec);
  const span = sitEnd - sitStart;
  // Interior marks only: an interval chime landing ON the opening or closing bell
  // would double up, which is the overlap this design exists to avoid.
  for (let i = 1; i <= c.intervals; i++) {
    const at = sitStart + (span * i) / (c.intervals + 1);
    marks.push({ at, cue: "interval" });
  }
  marks.push({ at: sitEnd, cue: "close" });
  return marks;
}

/**
 * The view at `elapsed` seconds. `prevElapsed` is the previous tick, used to
 * decide whether a mark was crossed — a mark fires when it lands in the half-open
 * window (prevElapsed, elapsed]. A tick that finishes the session reports no cue
 * other than the close, so nothing ever sounds twice at once.
 */
export function meditationView(
  elapsedRaw: number,
  prevElapsed: number,
  c: MeditationConfig,
): MeditationView {
  const elapsed = Math.min(Math.max(elapsedRaw, 0), c.totalSec);
  const finished = elapsed >= c.totalSec;
  const sitStart = c.settleSec;
  const sitEnd = Math.max(sitStart, c.totalSec - c.closingSec);

  const phase: MeditationPhase = finished
    ? "finished"
    : elapsed < sitStart
      ? "settling"
      : elapsed < sitEnd
        ? "sitting"
        : "closing";

  const span = sitEnd - sitStart;
  const progress =
    span <= 0 ? 1 : Math.min(1, Math.max(0, (elapsed - sitStart) / span));

  let cue: MeditationCue | null = null;
  for (const m of cueMarks(c)) {
    if (m.at > prevElapsed && m.at <= elapsed) {
      // Later marks win within one tick, so a slow tick that swallows two marks
      // sounds the more significant one rather than both.
      cue = m.cue;
    }
  }

  return {
    phase,
    elapsed,
    totalRemaining: Math.max(0, c.totalSec - elapsed),
    progress,
    cue,
    finished,
  };
}
