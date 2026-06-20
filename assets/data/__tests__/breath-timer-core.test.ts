import { BOX, NADI_SHODHANA, METRONOME, FOUR_SEVEN_EIGHT, buildTimeline, cycleDurationSec } from "../breath-patterns";
import { phaseBoundaries, clicksBetween, breathView, downbeatBeats, downbeatsBetween } from "../breath-timer-core";

const boxTL = buildTimeline(BOX); // boundaries at 0,4,8,12 ; cycle 16
const boxCycle = cycleDurationSec(BOX);

describe("phaseBoundaries", () => {
  it("returns one boundary per phase at its start", () => {
    expect(phaseBoundaries(boxTL).map((b) => b.start)).toEqual([0, 4, 8, 12]);
    expect(phaseBoundaries(boxTL).map((b) => b.phaseIndex)).toEqual([0, 1, 2, 3]);
  });

  it("uses the click-slot start when there is a slot", () => {
    const tl = buildTimeline(BOX, { clickSlotSec: 0.3 }); // boundaries at 0,4.3,8.6,12.9
    const starts = phaseBoundaries(tl).map((b) => b.start);
    expect(starts[0]).toBeCloseTo(0, 5);
    expect(starts[1]).toBeCloseTo(4.3, 5);
    expect(starts[2]).toBeCloseTo(8.6, 5);
  });
});

describe("clicksBetween", () => {
  it("fires the first boundary on the opening tick", () => {
    const clicks = clicksBetween(0, 0.1, boxTL, boxCycle);
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toMatchObject({ time: 0, phaseIndex: 0, kind: "inhale" });
  });

  it("does not refire a boundary already passed", () => {
    expect(clicksBetween(0.1, 0.2, boxTL, boxCycle)).toHaveLength(0);
  });

  it("fires each phase boundary exactly once across a tick", () => {
    expect(clicksBetween(3.95, 4.05, boxTL, boxCycle)).toMatchObject([{ time: 4, phaseIndex: 1 }]);
    expect(clicksBetween(7.95, 8.05, boxTL, boxCycle)).toMatchObject([{ time: 8, phaseIndex: 2 }]);
  });

  it("loops: the next cycle's first boundary fires after the cycle wraps", () => {
    const clicks = clicksBetween(15.95, 16.05, boxTL, boxCycle);
    expect(clicks).toMatchObject([{ time: 16, phaseIndex: 0, kind: "inhale" }]);
  });

  it("can catch multiple boundaries in a long tick", () => {
    const clicks = clicksBetween(0, 9, boxTL, boxCycle);
    expect(clicks.map((c) => c.time)).toEqual([0, 4, 8]);
  });

  it("returns nothing for a non-advancing or zero-cycle window", () => {
    expect(clicksBetween(5, 5, boxTL, boxCycle)).toHaveLength(0);
    expect(clicksBetween(0, 1, boxTL, 0)).toHaveLength(0);
  });
});

describe("metronome", () => {
  it("clicks every interval (uniform grid)", () => {
    const tl = buildTimeline(METRONOME); // interval 3, cycle 3
    const cyc = cycleDurationSec(METRONOME);
    expect(clicksBetween(0, 9, tl, cyc).map((c) => c.time)).toEqual([0, 3, 6]);
  });
});

describe("breathView", () => {
  it("reports the active phase, count and totals", () => {
    const v = breathView(2, boxTL, boxCycle, 60);
    expect(v).toMatchObject({
      phaseIndex: 0,
      kind: "inhale",
      label: "Inhale",
      segmentType: "breath",
      countRemaining: 2, // 4 - 2
      totalRemaining: 58,
      finished: false,
    });
  });

  it("wraps the cycle (elapsed 16 == start of cycle 2)", () => {
    const v = breathView(16, boxTL, boxCycle, 60);
    expect(v).toMatchObject({ phaseIndex: 0, countRemaining: 4, cycleElapsed: 0, totalRemaining: 44 });
  });

  it("marks finished at/after total duration", () => {
    const v = breathView(60, boxTL, boxCycle, 60);
    expect(v.finished).toBe(true);
    expect(v.totalRemaining).toBe(0);
  });

  it("shows a click segment (count 0) during a click slot", () => {
    const tl = buildTimeline(NADI_SHODHANA, { clickSlotSec: 0.3 });
    const cyc = cycleDurationSec(NADI_SHODHANA, { clickSlotSec: 0.3 });
    const v = breathView(0.1, tl, cyc, 120);
    expect(v.segmentType).toBe("click");
    expect(v.countRemaining).toBe(0);
  });
});

describe("downbeatBeats", () => {
  it("pulses each count of inhale & exhale (skips count 1 and the holds)", () => {
    // Box, no click slots: inhale 0-4, hold 4-8, exhale 8-12, hold 12-16.
    expect(downbeatBeats(buildTimeline(BOX), 1)).toEqual([1, 2, 3, 9, 10, 11]);
  });

  it("covers a long exhale; the zero-count closing hold adds nothing (4-7-8)", () => {
    // inhale 0-4, hold 4-11, exhale 11-19.
    expect(downbeatBeats(buildTimeline(FOUR_SEVEN_EIGHT), 1)).toEqual([
      1, 2, 3, 12, 13, 14, 15, 16, 17, 18,
    ]);
  });
});

describe("downbeatsBetween", () => {
  const tl = buildTimeline(BOX); // downbeats at 1,2,3,9,10,11 per 16s cycle

  it("returns the downbeats inside one cycle", () => {
    expect(downbeatsBetween(0, 16, tl, 16, 1)).toEqual([1, 2, 3, 9, 10, 11]);
  });

  it("is half-open [prev, next)", () => {
    expect(downbeatsBetween(2, 10, tl, 16, 1)).toEqual([2, 3, 9]);
  });

  it("loops across cycle boundaries", () => {
    expect(downbeatsBetween(15, 20, tl, 16, 1)).toEqual([17, 18, 19]);
  });

  it("is empty when no downbeat falls in the window (mid-hold)", () => {
    expect(downbeatsBetween(4, 9, tl, 16, 1)).toEqual([]);
  });
});
