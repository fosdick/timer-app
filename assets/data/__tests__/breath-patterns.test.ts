import {
  METRONOME,
  BOX,
  NADI_SHODHANA,
  VILOMA,
  FOUR_SEVEN_EIGHT,
  VISAMAVRITTI,
  isMetronome,
  editableFields,
  countFields,
  applyCountEdit,
  getPattern,
  resolvePhases,
  isEvenPattern,
  patternColumns,
  activeColumnIndex,
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

  it("labels both holds 'Retention'", () => {
    expect(resolvePhases(BOX).map((p) => p.label)).toEqual(["Inhale", "Retention", "Exhale", "Retention"]);
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

describe("activeColumnIndex", () => {
  it("maps each phase to its own column for odd patterns", () => {
    expect(activeColumnIndex(VILOMA, "inhale")).toBe(0);
    expect(activeColumnIndex(VILOMA, "holdIn")).toBe(1);
    expect(activeColumnIndex(VILOMA, "exhale")).toBe(2);
    expect(activeColumnIndex(VILOMA, "holdOut")).toBe(3);
  });
  it("collapses inhale/exhale and the holds for even patterns", () => {
    expect(activeColumnIndex(NADI_SHODHANA, "inhale")).toBe(0);
    expect(activeColumnIndex(NADI_SHODHANA, "exhale")).toBe(0);
    expect(activeColumnIndex(NADI_SHODHANA, "holdIn")).toBe(1);
    expect(activeColumnIndex(NADI_SHODHANA, "holdOut")).toBe(1);
  });
});

describe("metronome", () => {
  it("resolves to a single phase using only the interval", () => {
    const phases = resolvePhases(METRONOME);
    expect(phases).toHaveLength(1);
    expect(phases[0].count).toBe(METRONOME.inhale);
  });
  it("cycle is just the interval", () => {
    expect(cycleDurationSec(METRONOME)).toBe(METRONOME.inhale);
  });
  it("isMetronome flags only the metronome", () => {
    expect(isMetronome(METRONOME)).toBe(true);
    expect(isMetronome(VILOMA)).toBe(false);
    expect(isMetronome(BOX)).toBe(false);
  });
  it("4-7-8 is locked, others are not", () => {
    expect(FOUR_SEVEN_EIGHT.locked).toBe(true);
    expect(VILOMA.locked).toBeUndefined();
  });
});

describe("editableFields", () => {
  it("has none for locked 4-7-8", () => {
    expect(editableFields(FOUR_SEVEN_EIGHT)).toEqual([]);
  });
  it("has one interval for metronome", () => {
    expect(editableFields(METRONOME)).toEqual([{ key: "interval", label: "Count", value: 3 }]);
  });
  it("has breath + symmetric retention for even patterns", () => {
    const f = editableFields(BOX);
    expect(f.map((x) => x.key)).toEqual(["breath", "holdSym"]);
    expect(f.map((x) => x.label)).toEqual(["Breath", "Retention"]);
  });
  it("has breath + both retentions for odd patterns", () => {
    const f = editableFields(VILOMA);
    expect(f.map((x) => x.key)).toEqual(["breath", "holdIn", "holdOut"]);
    expect(f.map((x) => x.label)).toEqual(["Breath", "Retention in", "Retention out"]);
    expect(f.map((x) => x.value)).toEqual([16, 6, 4]);
  });
  it("splitHolds (Nadi Shodhana) gets the 3-box odd shape despite even values", () => {
    expect(editableFields(NADI_SHODHANA).map((f) => f.key)).toEqual(["breath", "holdIn", "holdOut"]);
  });
  it("keeps the odd shape when an odd pattern's holds are edited equal (Viloma bug)", () => {
    const edited = applyCountEdit(VILOMA, "holdIn", VILOMA.holdOut); // live values now look even
    expect(editableFields(edited).map((f) => f.key)).toEqual(["breath", "holdIn", "holdOut"]);
  });
  it("independentCounts (Visamavritti) gets all four boxes, separately editable", () => {
    const f = editableFields(VISAMAVRITTI);
    expect(f.map((x) => x.key)).toEqual(["inhale", "holdIn", "exhale", "holdOut"]);
    expect(f.map((x) => x.label)).toEqual(["Inhale", "Retention in", "Exhale", "Retention out"]);
    expect(f.map((x) => x.value)).toEqual([4, 16, 8, 12]);
  });
});

describe("countFields", () => {
  it("locked 4-7-8 shows display-only In/Retention/Out (zero hold dropped)", () => {
    const f = countFields(FOUR_SEVEN_EIGHT);
    expect(f.map((x) => [x.label, x.value, x.editable])).toEqual([
      ["In", 4, false],
      ["Retention", 7, false],
      ["Out", 8, false],
    ]);
    expect(f.map((x) => x.kinds)).toEqual([["inhale"], ["holdIn"], ["exhale"]]);
  });
  it("even patterns: Breath lights for inhale+exhale, Retention for both holds", () => {
    const f = countFields(BOX);
    expect(f.map((x) => x.kinds)).toEqual([
      ["inhale", "exhale"],
      ["holdIn", "holdOut"],
    ]);
    expect(f.every((x) => x.editable)).toBe(true);
  });
  it("splitHolds patterns: each retention lights its own field", () => {
    expect(countFields(NADI_SHODHANA).map((x) => x.kinds)).toEqual([
      ["inhale", "exhale"],
      ["holdIn"],
      ["holdOut"],
    ]);
  });
  it("odd patterns: each hold lights its own field", () => {
    const f = countFields(VILOMA);
    expect(f.map((x) => x.kinds)).toEqual([["inhale", "exhale"], ["holdIn"], ["holdOut"]]);
  });
  it("metronome: a single editable Count with no phase highlight", () => {
    const f = countFields(METRONOME);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ label: "Count", editable: true, kinds: [] });
  });
  it("independentCounts patterns: every phase lights only its own field", () => {
    expect(countFields(VISAMAVRITTI).map((x) => x.kinds)).toEqual([
      ["inhale"],
      ["holdIn"],
      ["exhale"],
      ["holdOut"],
    ]);
  });
});

describe("applyCountEdit", () => {
  it("breath sets inhale and exhale together", () => {
    const p = applyCountEdit(NADI_SHODHANA, "breath", 8);
    expect(p.inhale).toBe(8);
    expect(p.exhale).toBe(8);
  });
  it("holdSym sets both holds; holdIn/holdOut set one", () => {
    expect(applyCountEdit(NADI_SHODHANA, "holdSym", 3)).toMatchObject({ holdIn: 3, holdOut: 3 });
    expect(applyCountEdit(VILOMA, "holdOut", 9)).toMatchObject({ holdIn: 6, holdOut: 9 });
  });
  it("clamps breath and interval to at least 1, holds to at least 0", () => {
    expect(applyCountEdit(VILOMA, "breath", 0).inhale).toBe(1);
    expect(applyCountEdit(METRONOME, "interval", 0).inhale).toBe(1);
    expect(applyCountEdit(VILOMA, "holdIn", -5).holdIn).toBe(0);
  });
  it("inhale/exhale edit independently (Visamavritti), clamped to at least 1", () => {
    const p = applyCountEdit(VISAMAVRITTI, "inhale", 6);
    expect(p.inhale).toBe(6);
    expect(p.exhale).toBe(8); // untouched — unequal breath is the point
    expect(applyCountEdit(VISAMAVRITTI, "exhale", 0).exhale).toBe(1);
  });
  it("does not mutate the original pattern", () => {
    const before = { ...VILOMA };
    applyCountEdit(VILOMA, "breath", 99);
    expect(VILOMA).toEqual(before);
  });
});

describe("getPattern", () => {
  it("looks up by id", () => {
    expect(getPattern("viloma")).toBe(VILOMA);
    expect(getPattern("nope")).toBeUndefined();
  });
});
