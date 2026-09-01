import {
  cueMarks,
  meditationView,
  DEFAULT_MEDITATION,
  type MeditationConfig,
} from "../meditation-core";

const C: MeditationConfig = { totalSec: 600, settleSec: 10, intervals: 3, closingSec: 15 };

/** Walk a session second by second and collect every cue that fired. */
const run = (c: MeditationConfig, step = 1) => {
  const fired: { at: number; cue: string }[] = [];
  let prev = 0;
  for (let t = step; t <= c.totalSec + step; t += step) {
    const v = meditationView(t, prev, c);
    if (v.cue) fired.push({ at: Math.round(t * 100) / 100, cue: v.cue });
    prev = t;
  }
  return fired;
};

describe("session shape", () => {
  it("settles in silence, then opens with a bell", () => {
    expect(meditationView(5, 4, C).phase).toBe("settling");
    expect(meditationView(5, 4, C).cue).toBeNull();
    expect(meditationView(10, 9, C).cue).toBe("open");
  });

  it("moves settling -> sitting -> closing -> finished", () => {
    expect(meditationView(3, 2, C).phase).toBe("settling");
    expect(meditationView(300, 299, C).phase).toBe("sitting");
    expect(meditationView(590, 589, C).phase).toBe("closing");
    expect(meditationView(600, 599, C).phase).toBe("finished");
  });

  it("reports the session as finished exactly at the total, not after", () => {
    expect(meditationView(599, 598, C).finished).toBe(false);
    expect(meditationView(600, 599, C).finished).toBe(true);
  });

  it("clamps past the end rather than running negative", () => {
    const v = meditationView(9999, 600, C);
    expect(v.elapsed).toBe(600);
    expect(v.totalRemaining).toBe(0);
  });
});

describe("cues", () => {
  it("fires open, the interval chimes, and close — once each", () => {
    const fired = run(C);
    expect(fired.map((f) => f.cue)).toEqual(["open", "interval", "interval", "interval", "close"]);
  });

  it("spaces the interval chimes evenly inside the sit", () => {
    // sit is 10..585, so thirds land at 153.75 / 297.5 / 441.25
    const marks = cueMarks(C).filter((m) => m.cue === "interval").map((m) => m.at);
    const gaps = marks.slice(1).map((m, i) => Math.round((m - marks[i]) * 100) / 100);
    expect(new Set(gaps).size).toBe(1);
  });

  it("never lands an interval chime on the opening or closing bell", () => {
    // This is the overlap rule: two sounds on one tick is the bug that shipped in
    // the breath timer, and the reason interval marks are interior only.
    const all = cueMarks(C);
    const open = all.find((m) => m.cue === "open")!.at;
    const close = all.find((m) => m.cue === "close")!.at;
    const clash = all.filter((m) => m.cue === "interval" && (m.at === open || m.at === close));
    expect(clash).toEqual([]);
  });

  it("sounds nothing twice on one tick, even at 5s resolution", () => {
    // A coarse tick can swallow two marks; the later one wins rather than both.
    const fired = run(C, 5);
    expect(fired.map((f) => f.cue)).toEqual(["open", "interval", "interval", "interval", "close"]);
  });

  it("fires no cue at all when intervals are off", () => {
    const fired = run({ ...C, intervals: 0 });
    expect(fired.map((f) => f.cue)).toEqual(["open", "close"]);
  });
});

describe("degenerate configs do not throw or divide by zero", () => {
  it("survives a session shorter than its own settling + closing", () => {
    const tiny: MeditationConfig = { totalSec: 10, settleSec: 10, intervals: 3, closingSec: 15 };
    const v = meditationView(5, 4, tiny);
    expect(Number.isFinite(v.progress)).toBe(true);
    expect(v.progress).toBeGreaterThanOrEqual(0);
    expect(v.progress).toBeLessThanOrEqual(1);
  });

  it("keeps progress inside 0..1 across a whole default session", () => {
    for (let t = 0; t <= DEFAULT_MEDITATION.totalSec; t += 7) {
      const p = meditationView(t, t - 7, DEFAULT_MEDITATION).progress;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});
