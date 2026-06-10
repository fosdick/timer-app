/**
 * Breath patterns — the pure, UI-free model behind the breath timer.
 *
 * A pattern is four phase counts: inhale → hold-in → exhale → hold-out. A count
 * is a breath beat (1 count ≈ 1 second by default). A phase with count 0 is
 * skipped (e.g. 4-7-8 has no hold after the exhale).
 *
 * "Even" patterns have inhale==exhale and hold-in==hold-out, so the UI shows two
 * columns; "odd" patterns differ, so the UI shows four. (From the sketch:
 * "if odd show all four columns, if even show two".)
 *
 * The timeline expands a pattern into ordered SEGMENTS. Each active phase becomes
 * an optional "click" segment (the boundary chime in its own little time
 * container — the "click in its own space" idea) followed by a "breath" segment
 * (the count the practitioner breathes through). Everything here is pure and
 * deterministic so it can be unit-tested without React Native.
 */

export type BreathPhaseKind = "inhale" | "holdIn" | "exhale" | "holdOut";

export interface BreathPattern {
  id: string;
  name: string;
  /** Phase counts (breath beats). 0 = phase skipped. */
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  /**
   * Metronome mode (the original pranayama grid): a single uniform interval —
   * a click every `inhale` seconds, no phases, no inhale/exhale labels. Only the
   * `inhale` count is used.
   */
  metronome?: boolean;
  /** Counts are fixed and not user-editable (e.g. 4-7-8). */
  locked?: boolean;
  /** Edit the two retentions separately (odd-style 3 boxes) even when the
   * pattern's values are symmetric (e.g. Nadi Shodhana). */
  splitHolds?: boolean;
}

export interface ResolvedPhase {
  kind: BreathPhaseKind;
  label: string; // "Inhale" | "Retention" | "Exhale" | "Retention"
  count: number; // always > 0 (zero-count phases are dropped)
}

export type SegmentType = "click" | "breath";

export interface BreathSegment {
  phaseIndex: number; // index into the resolved-phases array
  kind: BreathPhaseKind;
  label: string;
  type: SegmentType;
  /** Cycle-relative start, seconds. */
  start: number;
  /** Seconds. A click segment may be 0 when there is no click slot. */
  duration: number;
}

export interface PatternColumns {
  mode: "even" | "odd";
  columns: { kind: BreathPhaseKind; count: number }[];
}

// ─── Library ──────────────────────────────────────────────────────────────────

// Metronome — the original pranayama grid. One interval; a click every N
// seconds; the practitioner maps their own breath onto it. HIGHEST priority to
// preserve (it was the existing pranayama before the breath-pattern rebuild).
export const METRONOME: BreathPattern = {
  id: "metronome",
  name: "Metronome",
  inhale: 3,
  holdIn: 0,
  exhale: 0,
  holdOut: 0,
  metronome: true,
};

export const BOX: BreathPattern = { id: "box", name: "Box", inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 };

// Nadi Shodhana — even pacing (10 on, 2 off) but with independently editable
// retentions, like Viloma's three boxes.
export const NADI_SHODHANA: BreathPattern = { id: "nadi", name: "Nadi Shodhana", inhale: 10, holdIn: 2, exhale: 10, holdOut: 2, splitHolds: true };

// Viloma — odd: equal inhale/exhale with longer, asymmetric holds.
export const VILOMA: BreathPattern = { id: "viloma", name: "Viloma", inhale: 16, holdIn: 6, exhale: 16, holdOut: 4 };

// 4-7-8 — inhale 4, hold 7, exhale 8, no closing hold. Fixed counts.
export const FOUR_SEVEN_EIGHT: BreathPattern = { id: "478", name: "4-7-8", inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, locked: true };

export const BREATH_PATTERNS: BreathPattern[] = [METRONOME, BOX, NADI_SHODHANA, VILOMA, FOUR_SEVEN_EIGHT];

export const getPattern = (id: string): BreathPattern | undefined =>
  BREATH_PATTERNS.find((p) => p.id === id);

/** Metronome mode: a single uniform click interval, no phases/labels. */
export const isMetronome = (p: BreathPattern): boolean => p.metronome === true;

// ─── Editable counts ──────────────────────────────────────────────────────────

export type EditFieldKey = "interval" | "breath" | "holdSym" | "holdIn" | "holdOut";

export interface EditField {
  key: EditFieldKey;
  label: string;
  value: number;
}

/**
 * The user-editable count fields for a pattern (drives the scroll-picker UI):
 *   - locked (4-7-8): none
 *   - metronome: one "Count" interval
 *   - even: "Breath" (inhale=exhale) + "Retention" (holdIn=holdOut)
 *   - odd or splitHolds: "Breath" + "Retention in" + "Retention out"
 */
export function editableFields(p: BreathPattern): EditField[] {
  if (p.locked) return [];
  if (isMetronome(p)) return [{ key: "interval", label: "Count", value: p.inhale }];
  // Decide the field shape from the pattern's INHERENT (library) symmetry, not
  // the live values — otherwise editing an odd pattern's two holds to be equal
  // would collapse it to "even" and drop the second hold field (the Viloma bug).
  const base = getPattern(p.id) ?? p;
  if (isEvenPattern(base) && !base.splitHolds) {
    return [
      { key: "breath", label: "Breath", value: p.inhale },
      { key: "holdSym", label: "Retention", value: p.holdIn },
    ];
  }
  return [
    { key: "breath", label: "Breath", value: p.inhale },
    { key: "holdIn", label: "Retention in", value: p.holdIn },
    { key: "holdOut", label: "Retention out", value: p.holdOut },
  ];
}

export interface CountField {
  /** An EditFieldKey when editable; the phase kind for locked display-only fields. */
  key: string;
  label: string;
  value: number;
  /** Phase kinds that highlight this field while the timer is running. */
  kinds: BreathPhaseKind[];
  editable: boolean;
}

const FIELD_KINDS: Record<EditFieldKey, BreathPhaseKind[]> = {
  interval: [],
  breath: ["inhale", "exhale"],
  holdSym: ["holdIn", "holdOut"],
  holdIn: ["holdIn"],
  holdOut: ["holdOut"],
};

/**
 * The single merged count row: the editable fields (tap to edit), or one
 * display-only field per resolved phase for locked patterns (4-7-8). `kinds`
 * says which phase kinds light the field up while running, so the row doubles
 * as the live phase display.
 */
export function countFields(p: BreathPattern): CountField[] {
  if (p.locked) {
    return resolvePhases(p).map((ph) => ({
      key: ph.kind,
      label: KIND_SHORT[ph.kind],
      value: ph.count,
      kinds: [ph.kind],
      editable: false,
    }));
  }
  return editableFields(p).map((f) => ({ ...f, kinds: FIELD_KINDS[f.key], editable: true }));
}

/** Apply an edited value to a field, returning a new pattern (counts clamped). */
export function applyCountEdit(p: BreathPattern, key: EditFieldKey, value: number): BreathPattern {
  const v = Math.max(0, Math.round(value));
  switch (key) {
    case "interval":
      return { ...p, inhale: Math.max(1, v) };
    case "breath":
      return { ...p, inhale: Math.max(1, v), exhale: Math.max(1, v) };
    case "holdSym":
      return { ...p, holdIn: v, holdOut: v };
    case "holdIn":
      return { ...p, holdIn: v };
    case "holdOut":
      return { ...p, holdOut: v };
    default:
      return p;
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const KIND_LABEL: Record<BreathPhaseKind, string> = {
  inhale: "Inhale",
  holdIn: "Retention",
  exhale: "Exhale",
  holdOut: "Retention",
};

const KIND_SHORT: Record<BreathPhaseKind, string> = {
  inhale: "In",
  holdIn: "Retention",
  exhale: "Out",
  holdOut: "Retention",
};

const PHASE_ORDER: BreathPhaseKind[] = ["inhale", "holdIn", "exhale", "holdOut"];

/** Ordered phases with count > 0 (skips empty holds like 4-7-8's closing hold). */
export function resolvePhases(p: BreathPattern): ResolvedPhase[] {
  return PHASE_ORDER.map((kind) => ({ kind, label: KIND_LABEL[kind], count: p[kind] }))
    .filter((phase) => phase.count > 0);
}

/** Even = inhale==exhale && hold-in==hold-out (symmetric breath). */
export function isEvenPattern(p: BreathPattern): boolean {
  return p.inhale === p.exhale && p.holdIn === p.holdOut;
}

/** Display columns: 2 for even patterns, 4 for odd. */
export function patternColumns(p: BreathPattern): PatternColumns {
  if (isEvenPattern(p)) {
    return {
      mode: "even",
      columns: [
        { kind: "inhale", count: p.inhale },
        { kind: "holdIn", count: p.holdIn },
      ],
    };
  }
  return {
    mode: "odd",
    columns: [
      { kind: "inhale", count: p.inhale },
      { kind: "holdIn", count: p.holdIn },
      { kind: "exhale", count: p.exhale },
      { kind: "holdOut", count: p.holdOut },
    ],
  };
}

/**
 * Which display column (from patternColumns) a given phase highlights while
 * running. Even patterns collapse inhale/exhale onto column 0 and the two holds
 * onto column 1; odd patterns map each phase to its own column.
 */
export function activeColumnIndex(p: BreathPattern, kind: BreathPhaseKind): number {
  if (isEvenPattern(p)) {
    return kind === "inhale" || kind === "exhale" ? 0 : 1;
  }
  const order: Record<BreathPhaseKind, number> = { inhale: 0, holdIn: 1, exhale: 2, holdOut: 3 };
  return order[kind];
}

export interface TimelineOptions {
  /** Seconds the boundary click occupies before each phase. 0 = no slot. */
  clickSlotSec?: number;
  /** Seconds per breath count. Default 1. */
  countDurationSec?: number;
}

/**
 * Expand a pattern into ordered segments for one cycle. Each phase is a click
 * segment (duration = clickSlotSec, may be 0) immediately followed by a breath
 * segment (duration = count * countDurationSec). The click leads the phase so it
 * marks "begin this phase now".
 */
export function buildTimeline(p: BreathPattern, opts: TimelineOptions = {}): BreathSegment[] {
  const clickSlotSec = opts.clickSlotSec ?? 0;
  const countDurationSec = opts.countDurationSec ?? 1;
  const phases = resolvePhases(p);
  const segments: BreathSegment[] = [];
  let t = 0;
  phases.forEach((phase, phaseIndex) => {
    segments.push({
      phaseIndex,
      kind: phase.kind,
      label: phase.label,
      type: "click",
      start: t,
      duration: clickSlotSec,
    });
    t += clickSlotSec;
    segments.push({
      phaseIndex,
      kind: phase.kind,
      label: phase.label,
      type: "breath",
      start: t,
      duration: phase.count * countDurationSec,
    });
    t += phase.count * countDurationSec;
  });
  return segments;
}

/** Total seconds for one cycle. */
export function cycleDurationSec(p: BreathPattern, opts: TimelineOptions = {}): number {
  const timeline = buildTimeline(p, opts);
  if (timeline.length === 0) return 0;
  const last = timeline[timeline.length - 1];
  return last.start + last.duration;
}

export interface SegmentAtTime {
  segment: BreathSegment;
  index: number; // index into the timeline
  /** Seconds remaining in this segment. */
  remaining: number;
}

/**
 * Which segment is active at `elapsedSec` within a single (un-looped) cycle.
 * Zero-duration segments (e.g. an empty click slot) are never returned.
 * Returns null only for an empty timeline.
 */
export function segmentAtElapsed(timeline: BreathSegment[], elapsedSec: number): SegmentAtTime | null {
  if (timeline.length === 0) return null;
  for (let i = 0; i < timeline.length; i++) {
    const seg = timeline[i];
    if (seg.duration <= 0) continue;
    if (elapsedSec < seg.start + seg.duration) {
      return { segment: seg, index: i, remaining: seg.start + seg.duration - elapsedSec };
    }
  }
  // Past the end — clamp to the last non-empty segment.
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].duration > 0) {
      return { segment: timeline[i], index: i, remaining: 0 };
    }
  }
  return null;
}
