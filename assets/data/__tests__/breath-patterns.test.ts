import {
  BOX,
  NADI_SHODHANA,
  VILOMA,
  FOUR_SEVEN_EIGHT,
  getPattern,
  resolvePhases,
  isEvenPattern,
  patternColumns,
  buildTimeline,
  cycleDurationSec,
  segmentAtElapsed,
} from "../breath-patterns";

describe("resolvePhases", () => {
  it("keeps all four phases when none are zero", () => {
    const phases = resolvePhases(VILOMA);
    expect(phases.map((p) => p.kind)).toEqual(["inhale", "holdIn", "exhale", "holdOut"]);
    expect(phases.map((p) => p.count)).toEqual([16, 6, 16, 4]);
  });

  it("drops a zero-count phase (4-7-8 has no closing hold)", () => {
    const phases = resolvePhases(FOUR_SEVEN_EIGHT);
    expect(phases.map((p) => p.kind)).toEqual(["inhale", "holdIn", "exhale"]);
    expect(phases.map((p) => p.count)).toEqual([4, 7, 8]);
  });

  it("labels both holds 'Hold'", () => {
    expect(resolvePhases(BOX).map((p) => p.label)).toEqual(["Inhale", "Hold", "Exhale", "Hold"]);
  });
});

describe("isEvenPattern", () => {
  it("is even when inhale==exhale and holdIn==holdOut", () => {
    expect(isEvenPattern(BOX)).toBe(true);
    expect(isEvenPattern(NADI_SHODHANA)).toBe(true);
  });
  it("is odd otherwise", () => {
    expect(isEvenPattern(VILOMA)).toBe(false);
    expect(isEvenPattern(FOUR_SEVEN_EIGHT)).toBe(false);
  });
});

describe("patternColumns", () => {
  it("gives two columns for even patterns", () => {
    const cols = patternColumns(NADI_SHODHANA);
    expect(cols.mode).toBe("even");
    expect(cols.columns).toEqual([
      { kind: "inhale", count: 10 },
      { kind: "holdIn", count: 2 },
    ]);
  });
  it("gives four columns for odd patterns", () => {
    const cols = patternColumns(VILOMA);
    expect(cols.mode).toBe("odd");
    expect(cols.columns.map((c) => c.count)).toEqual([16, 6, 16, 4]);
  });
});

describe("cycleDurationSec", () => {
  it("sums the counts with no click slot", () => {
    expect(cycleDurationSec(BOX)).toBe(16);
    expect(cycleDurationSec(NADI_SHODHANA)).toBe(24);
    expect(cycleDurationSec(VILOMA)).toBe(42);
    expect(cycleDurationSec(FOUR_SEVEN_EIGHT)).toBe(19); // 4+7+8, no closing hold
  });
  it("adds one click slot per active phase", () => {
    // Box has 4 phases → +4 * 0.3 = 1.2
    expect(cycleDurationSec(BOX, { clickSlotSec: 0.3 })).toBeCloseTo(17.2, 5);
    // 4-7-8 has 3 phases → +3 * 0.5 = 1.5
    expect(cycleDurationSec(FOUR_SEVEN_EIGHT, { clickSlotSec: 0.5 })).toBeCloseTo(20.5, 5);
  });
  it("scales with countDurationSec", () => {
    expect(cycleDurationSec(BOX, { countDurationSec: 2 })).toBe(32);
  });
});

describe("buildTimeline", () => {
  it("emits a click+breath segment pair per phase", () => {
    const tl = buildTimeline(BOX); // clickSlot 0 by default
    expect(tl).toHaveLength(8); // 4 phases × 2
    expect(tl.filter((s) => s.type === "breath").map((s) => s.start)).toEqual([0, 4, 8, 12]);
    expect(tl.filter((s) => s.type === "breath").every((s) => s.duration === 4)).toBe(true);
  });

  it("places the click slot before each breath", () => {
    const tl = buildTimeline(NADI_SHODHANA, { clickSlotSec: 0.3 });
    // phase 0: click[0,0.3], breath[0.3,10]; phase 1: click[10.3,0.3], breath[10.6,2]...
    // (cumulative starts use toBeCloseTo — float accumulation is harmless here)
    expect(tl[0]).toMatchObject({ type: "click", duration: 0.3 });
    expect(tl[0].start).toBeCloseTo(0, 5);
    expect(tl[1]).toMatchObject({ type: "breath", duration: 10 });
    expect(tl[1].start).toBeCloseTo(0.3, 5);
    expect(tl[2]).toMatchObject({ type: "click", duration: 0.3 });
    expect(tl[2].start).toBeCloseTo(10.3, 5);
    expect(tl[3]).toMatchObject({ type: "breath", duration: 2 });
    expect(tl[3].start).toBeCloseTo(10.6, 5);
  });
});

describe("segmentAtElapsed", () => {
  const tl = buildTimeline(BOX); // breath segments at 0,4,8,12 (each 4s)

  it("finds the breath segment for a given time", () => {
    expect(segmentAtElapsed(tl, 2)).toMatchObject({ segment: { phaseIndex: 0, type: "breath" }, remaining: 2 });
    expect(segmentAtElapsed(tl, 5)).toMatchObject({ segment: { phaseIndex: 1, type: "breath" }, remaining: 3 });
    expect(segmentAtElapsed(tl, 12)).toMatchObject({ segment: { phaseIndex: 3, type: "breath" }, remaining: 4 });
  });

  it("returns the start of the next phase exactly on a boundary", () => {
    // elapsed 4 is the start of phase 1's breath (phase 0 breath is [0,4))
    expect(segmentAtElapsed(tl, 4)).toMatchObject({ segment: { phaseIndex: 1 }, remaining: 4 });
  });

  it("skips zero-duration click slots", () => {
    // all click segments have duration 0 here, so none should ever be returned
    for (let e = 0; e < 16; e += 0.5) {
      expect(segmentAtElapsed(tl, e)!.segment.type).toBe("breath");
    }
  });

  it("returns the click segment when a slot has duration", () => {
    const ctl = buildTimeline(BOX, { clickSlotSec: 0.3 });
    expect(segmentAtElapsed(ctl, 0.1)).toMatchObject({ segment: { type: "click", phaseIndex: 0 } });
    expect(segmentAtElapsed(ctl, 0.3)).toMatchObject({ segment: { type: "breath", phaseIndex: 0 } });
  });

  it("clamps past the end to the last segment", () => {
    expect(segmentAtElapsed(tl, 999)).toMatchObject({ segment: { phaseIndex: 3, type: "breath" }, remaining: 0 });
  });
});

describe("getPattern", () => {
  it("looks up by id", () => {
    expect(getPattern("viloma")).toBe(VILOMA);
    expect(getPattern("nope")).toBeUndefined();
  });
});
