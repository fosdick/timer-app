/**
 * Canonical-feature contract tests — the pure-layer enforceable subset of
 * docs/canonical-features.md (entries #2 and #3).
 *
 * If one of these fails, you are probably deleting something on purpose:
 * either canon is changing — amend docs/canonical-features.md in the SAME
 * commit — or stop, because you just caught a refactor loss before the user
 * had to find it in morning practice.
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

describe("canonical #3: 4-7-8 is a lock-in practice ('on 4-7-8, lock is correct')", () => {
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
