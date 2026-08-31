import { lotus, petalAngle, petalPath, LOTUS_PETALS } from "../lotus";

describe("lotus geometry", () => {
  it("draws ten petals — Manipura's count", () => {
    expect(LOTUS_PETALS).toBe(10);
    expect(lotus()).toHaveLength(10);
  });

  it("spaces the petals evenly all the way round", () => {
    const angles = lotus().map((p) => p.angle);
    expect(angles[0]).toBe(0); // first petal points up
    const steps = angles.slice(1).map((a, i) => a - angles[i]);
    expect(new Set(steps.map((s) => Number(s.toFixed(6))))).toEqual(new Set([36]));
    expect(Math.max(...angles)).toBeLessThan(360); // no duplicate at the top
  });

  it("closes every petal so it can be filled", () => {
    for (const { d } of lotus()) {
      expect(d.startsWith("M ")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
    }
  });

  it("puts the tip further out than the base", () => {
    // Guard the sign convention: SVG y grows downward, so an upward petal is all
    // negative y. Getting this backwards draws the flower inside out.
    const d = petalPath(50, 13, 13, 33);
    // Every command here takes x,y pairs, so the y values are the odd indices.
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const ys = nums.filter((_, i) => i % 2 === 1);
    expect(Math.min(...ys)).toBe(-50); // the tip
    expect(Math.max(...ys)).toBe(-13); // the base — nothing crosses the centre
  });

  it("scales with its arguments rather than hard-coding a size", () => {
    expect(petalPath(100, 26, 26, 66)).toContain("-100");
    expect(petalAngle(5, 10)).toBe(180);
  });
});
