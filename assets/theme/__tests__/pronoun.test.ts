/**
 * The pronoun glyph.
 *
 * Small surface, but two properties matter and both are easy to break by accident:
 *
 *  1. The colour is FIXED per pronoun and must never come from the accent. It is the
 *     one mark on screen that says something about the person rather than about the
 *     app, so recolouring the app must not recolour them. A future "tidy up, make
 *     everything themed" pass is exactly what would break this, so it is asserted
 *     rather than left as a comment.
 *  2. `they` is the default. Someone who never opens preferences gets the neutral
 *     glyph rather than a guess.
 */
import { PRONOUNS, PRONOUN_COLORS, PRONOUN_LABELS, type Pronoun } from "@/assets/images/svgx/user";
import { GREEN, BLUE } from "@/assets/theme/accent";
import { DEFAULT_USER_PREFERENCES } from "@/components/user-preferences-context";

const luminance = (hex: string): number => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

describe("the pronoun set", () => {
  it("offers she / they / he", () => {
    expect(PRONOUNS).toEqual(["she", "they", "he"]);
  });

  it("defaults to they", () => {
    expect(DEFAULT_USER_PREFERENCES.pronoun).toBe("they");
  });

  it("labels every option", () => {
    expect(PRONOUNS.filter((p) => !PRONOUN_LABELS[p])).toEqual([]);
  });

  it("uses three distinct HUES, not two blues and a pink", () => {
    // The first set had they #3E4A5C and he #2F4C68 — both slate, which is why the
    // three read as the same icon on device. Rose / olive / steel are far enough
    // apart to be a deliberate set while staying quiet.
    const hue = (hex: string): number => {
      const h = hex.replace("#", "");
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max === min) return 0;
      const d = max - min;
      const deg =
        max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (deg * 60 + 360) % 360;
    };
    const gap = (a: number, b: number) => {
      const d = Math.abs(a - b) % 360;
      return d > 180 ? 360 - d : d;
    };
    const tooClose: string[] = [];
    for (let i = 0; i < PRONOUNS.length; i++) {
      for (let j = i + 1; j < PRONOUNS.length; j++) {
        const [a, b] = [PRONOUNS[i], PRONOUNS[j]];
        if (gap(hue(PRONOUN_COLORS[a]), hue(PRONOUN_COLORS[b])) < 40) tooClose.push(`${a}/${b}`);
      }
    }
    expect(tooClose).toEqual([]);
  });

  it("gives every pronoun its own colour", () => {
    const values = PRONOUNS.map((p) => PRONOUN_COLORS[p]);
    expect(new Set(values).size).toBe(PRONOUNS.length);
    for (const v of values) expect(v).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe("the glyph colour is NOT themed", () => {
  it("shares no value with any accent ramp", () => {
    // The property that matters: a pronoun tone must never be an accent value, or a
    // theme change would move it.
    const accentValues = new Set([...Object.values(GREEN), ...Object.values(BLUE)].map((v) => v.toLowerCase()));
    const clashes = PRONOUNS.filter((p) => accentValues.has(PRONOUN_COLORS[p].toLowerCase()));
    expect(clashes).toEqual([]);
  });

  it("stays legible on the pale header disc", () => {
    // The glyph sits on a light circle in the header, so every tone must be dark
    // enough to read against it — "subtle" must not become "invisible".
    const tooLight = PRONOUNS.filter((p) => luminance(PRONOUN_COLORS[p]) > 0.25);
    expect(tooLight).toEqual([]);
  });

  it("keeps the tones quiet rather than saturated", () => {
    // Deliberately desaturated: this is a subtle personal marker, not a flag. Cap
    // the spread between the strongest and weakest channel.
    const loud: Pronoun[] = [];
    for (const p of PRONOUNS) {
      const h = PRONOUN_COLORS[p].replace("#", "");
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      if (Math.max(r, g, b) - Math.min(r, g, b) > 80) loud.push(p);
    }
    expect(loud).toEqual([]);
  });
});
