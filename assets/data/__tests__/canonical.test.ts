/**
 * Canonical-feature contract tests — the enforceable subset of
 * docs/canonical-features.md. These encode behaviors the user has explicitly
 * declared must never silently disappear.
 *
 * If one of these fails, you are probably deleting something on purpose:
 * either update docs/canonical-features.md in the same commit (canonical
 * changed, explicitly) — or stop, because you just caught a refactor loss.
 */
import {
  BREATH_PATTERNS,
  METRONOME,
  FOUR_SEVEN_EIGHT,
  getPattern,
  isMetronome,
  editableFields,
} from "../breath-patterns";

describe("canonical #2: the Metronome survives ('can not lose the metronome')", () => {
  it("exists in the library", () => {
    expect(getPattern("metronome")).toBe(METRONOME);
    expect(isMetronome(METRONOME)).toBe(true);
  });
  it("is the first / default pattern", () => {
    expect(BREATH_PATTERNS[0]).toBe(METRONOME);
  });
});

describe("canonical #3: 4-7-8 is a lock-in practice", () => {
  it("keeps the fixed 4/7/8/0 counts and the locked flag", () => {
    expect(FOUR_SEVEN_EIGHT).toMatchObject({
      inhale: 4,
      holdIn: 7,
      exhale: 8,
      holdOut: 0,
      locked: true,
    });
  });
  it("exposes no editable fields", () => {
    expect(editableFields(FOUR_SEVEN_EIGHT)).toEqual([]);
  });
});

describe("canonical #4: library pattern ids are stable (persisted selections key on them)", () => {
  it("keeps every shipped id", () => {
    const ids = BREATH_PATTERNS.map((p) => p.id);
    for (const id of ["metronome", "box", "nadi", "viloma", "478"]) {
      expect(ids).toContain(id);
    }
  });
});
