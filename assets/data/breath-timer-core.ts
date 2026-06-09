/**
 * Breath-timer core — the pure, testable engine logic.
 *
 * The React hook (useBreathTimer) owns the ticker, state and sound side-effects;
 * everything that can be reasoned about deterministically lives here so it can be
 * unit-tested without React Native or timers:
 *   - clicksBetween: which phase-boundary clicks fire in a tick window (handles
 *     cycle looping)
 *   - breathView: the full display state at any elapsed time
 */

import {
  BreathSegment,
  BreathPhaseKind,
  SegmentType,
  segmentAtElapsed,
} from "./breath-patterns";

export interface PhaseBoundary {
  start: number; // cycle-relative seconds
  phaseIndex: number;
  kind: BreathPhaseKind;
}

/** The cycle-relative start of each phase — where a boundary click belongs. */
export function phaseBoundaries(timeline: BreathSegment[]): PhaseBoundary[] {
  return timeline
    .filter((s) => s.type === "click")
    .map((s) => ({ start: s.start, phaseIndex: s.phaseIndex, kind: s.kind }));
}

export interface BreathClick {
  time: number; // absolute session time of the boundary
  phaseIndex: number;
  kind: BreathPhaseKind;
}

/**
 * Phase-boundary clicks that occur in the half-open window [prevElapsed,
 * nextElapsed), across cycle loops. Half-open & inclusive-start so each boundary
 * fires exactly once (the boundary at elapsed 0 fires on the first tick).
 */
export function clicksBetween(
  prevElapsed: number,
  nextElapsed: number,
  timeline: BreathSegment[],
  cycleDur: number,
): BreathClick[] {
  if (cycleDur <= 0 || nextElapsed <= prevElapsed) return [];
  const boundaries = phaseBoundaries(timeline);
  const out: BreathClick[] = [];
  const firstCycle = Math.floor(prevElapsed / cycleDur);
  const lastCycle = Math.floor((nextElapsed - 1e-9) / cycleDur);
  for (let c = firstCycle; c <= lastCycle; c++) {
    for (const b of boundaries) {
      const t = c * cycleDur + b.start;
      if (t >= prevElapsed && t < nextElapsed) {
        out.push({ time: t, phaseIndex: b.phaseIndex, kind: b.kind });
      }
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

export interface BreathView {
  totalRemaining: number; // seconds left in the whole session
  cycleElapsed: number; // seconds into the current cycle
  phaseIndex: number;
  kind: BreathPhaseKind;
  label: string;
  segmentType: SegmentType; // "click" | "breath"
  /** Counts remaining in the current breath (0 during a click slot). */
  countRemaining: number;
  /** Seconds remaining in the current segment. */
  segmentRemaining: number;
  finished: boolean;
}

/** Full display state at a given elapsed time. */
export function breathView(
  elapsed: number,
  timeline: BreathSegment[],
  cycleDur: number,
  totalDur: number,
  countDurationSec = 1,
): BreathView {
  const finished = elapsed >= totalDur;
  const e = finished ? totalDur : Math.max(0, elapsed);
  const cycleElapsed = cycleDur > 0 ? e % cycleDur : 0;
  const at = segmentAtElapsed(timeline, cycleElapsed);
  const seg = at?.segment;
  const segmentRemaining = at?.remaining ?? 0;
  const countRemaining =
    seg && seg.type === "breath" ? Math.ceil(segmentRemaining / countDurationSec) : 0;
  return {
    totalRemaining: Math.max(0, totalDur - e),
    cycleElapsed,
    phaseIndex: seg?.phaseIndex ?? 0,
    kind: seg?.kind ?? "inhale",
    label: seg?.label ?? "",
    segmentType: seg?.type ?? "breath",
    countRemaining,
    segmentRemaining,
    finished,
  };
}
