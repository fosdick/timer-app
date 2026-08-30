/**
 * Guards for adding accents as DATA.
 *
 * The whole premise of accent-only theming is that a new theme is 13 hex values and
 * cannot break the app. That only holds if something checks the shape — otherwise a
 * half-filled accent ships as `undefined` colours, which React Native renders as
 * transparent or black rather than throwing. These tests are what make "add a theme
 * casually" actually safe.
 *
 * The exact GREEN values are frozen separately in accent-parity.test.ts.
 */
import {
  ACCENTS,
  ACCENT_LABELS,
  DEFAULT_ACCENT_ID,
  GREEN,
  fixedColors,
  type Accent,
  type AccentId,
} from "../accent";

const ACCENT_KEYS: (keyof Accent)[] = [
  "bright", "soft", "mid", "muted", "border", "deep",
  "control", "track", "trackOff", "tint", "tintInk", "tintStrong", "surface",
];

const ids = Object.keys(ACCENTS) as AccentId[];

/** Relative luminance, WCAG definition. Used for ordering, not for a pass/fail ratio. */
const luminance = (hex: string): number => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

describe("every accent is complete and well-formed", () => {
  it("has at least the brand plus one alternative", () => {
    expect(ids).toContain("green");
    expect(ids.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ids)("%s defines all 13 tokens as valid hex", (id) => {
    const accent = ACCENTS[id];
    // Assert on a {token: value} map so a failure names the offending token rather
    // than just reporting "undefined". (jest's expect() takes one argument — the
    // expect(value, message) form is vitest's.)
    const shape = Object.fromEntries(
      ACCENT_KEYS.map((k) => [k, /^#[0-9A-Fa-f]{6}$/.test(accent[k] ?? "") ? "ok" : accent[k]]),
    );
    expect(shape).toEqual(Object.fromEntries(ACCENT_KEYS.map((k) => [k, "ok"])));
  });

  it.each(ids)("%s has no extra keys beyond the contract", (id) => {
    expect(Object.keys(ACCENTS[id]).sort()).toEqual([...ACCENT_KEYS].sort());
  });

  it("every accent has a display label for the picker", () => {
    expect(ids.filter((id) => !ACCENT_LABELS[id])).toEqual([]);
    // And no orphan labels for accents that no longer exist.
    expect(Object.keys(ACCENT_LABELS).sort()).toEqual([...ids].sort());
  });

  it("the default accent exists", () => {
    expect(ACCENTS[DEFAULT_ACCENT_ID]).toBeDefined();
    expect(DEFAULT_ACCENT_ID).toBe("green"); // the logo is green; green is the brand
  });
});

describe("accents are actually distinguishable", () => {
  it.each(ids.filter((id) => id !== "green"))(
    "%s differs from green in every token",
    (id) => {
      // A theme that reuses green's values isn't a theme. Catches a copy-paste entry
      // where only a couple of values were edited.
      const shared = ACCENT_KEYS.filter((k) => ACCENTS[id][k] === GREEN[k]);
      expect(shared).toEqual([]); // names the tokens that were left as green
    },
  );
});

describe("accents keep green's luminance relationships", () => {
  // This is the contrast safety argument. The ground never moves, so legibility
  // depends on each role sitting at a comparable brightness across accents. Rather
  // than assert absolute ratios (which would over-constrain hue choices), assert the
  // ORDER of the ramp — bright must be brighter than mid, which beats deep, etc.
  it.each(ids)("%s ramps from trackOff up to tintStrong", (id) => {
    const a = ACCENTS[id];
    expect(luminance(a.trackOff)).toBeLessThan(luminance(a.track));
    expect(luminance(a.track)).toBeLessThan(luminance(a.control));
    expect(luminance(a.control)).toBeLessThan(luminance(a.deep));
    expect(luminance(a.deep)).toBeLessThan(luminance(a.muted));
    expect(luminance(a.muted)).toBeLessThan(luminance(a.mid));
    expect(luminance(a.mid)).toBeLessThan(luminance(a.soft));
    expect(luminance(a.tintStrong)).toBeGreaterThan(luminance(a.soft));
  });

  it.each(ids)("%s keeps its pale surfaces pale and its dark surface dark", (id) => {
    const a = ACCENTS[id];
    // `tint` is the light header band; ink on it must be dark or the header is
    // unreadable — the exact bug that shipped in dark mode before 1.1.0.
    expect(luminance(a.tint)).toBeGreaterThan(0.5);
    expect(luminance(a.tintInk)).toBeLessThan(0.05);
    // `surface` is a subtle panel on the dark ground, so it must stay near-black.
    expect(luminance(a.surface)).toBeLessThan(0.05);
  });

  it.each(ids)("%s reads clearly against the fixed ground", (id) => {
    // The roles used for text on #080B0c. Not a full WCAG audit — a floor that
    // catches an accent whose "bright" is too dark to see.
    const a = ACCENTS[id];
    // `deep` is in this list because the Start button's label uses it. It was NOT
    // here originally, and that is exactly how blue shipped with the dimmest text on
    // screen sitting on its most important control.
    const tooDark = (["bright", "soft", "mid", "muted", "deep"] as const).filter(
      (k) => luminance(a[k]) <= 0.15,
    );
    expect(tooDark).toEqual([]); // names any role too dark for text on the ground
  });
});

describe("every accent is calibrated against green", () => {
  /**
   * The ordering tests above only check that a ramp goes the right DIRECTION. Blue
   * passed all of them while being visibly wrong: its `soft`/`mid`/`border` sat ~25%
   * brighter than green's and its `deep` ~35% darker. On screen that inverted the
   * hierarchy — the pattern chips shouted and the Start button, which uses `deep`,
   * became the faintest text on the page.
   *
   * Green is the reference because green is what shipped and what the logo is. An
   * accent is a HUE rotation, not a brightness redesign: hold each role at green's
   * luminance and any new theme inherits green's contrast decisions for free.
   */
  const TOLERANCE = 0.2; // ±20% relative luminance, role for role

  it.each(ids.filter((id) => id !== "green"))("%s matches green's luminance per role", (id) => {
    const a = ACCENTS[id];
    const drift = Object.fromEntries(
      ACCENT_KEYS.map((k) => {
        const g = luminance(GREEN[k]);
        const ratio = g === 0 ? 1 : luminance(a[k]) / g;
        return [k, Number(ratio.toFixed(2))];
      }).filter(([, r]) => Math.abs((r as number) - 1) > TOLERANCE),
    );
    // Names each off role and how far it drifted, e.g. { deep: 0.65 }.
    expect(drift).toEqual({});
  });

  it.each(ids)("%s is a hue rotation, not a greyscale", (id) => {
    // Guard the other direction: calibrating to green's luminance must not be done by
    // desaturating everything into slate.
    const a = ACCENTS[id];
    const spread = (hex: string) => {
      const h = hex.replace("#", "");
      const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      return Math.max(...ch) - Math.min(...ch);
    };
    const flat = (["bright", "soft", "mid", "muted", "border"] as const).filter(
      (k) => spread(a[k]) < 40,
    );
    expect(flat).toEqual([]);
  });
});

describe("the ink role is never themed", () => {
  /**
   * The breath tab read as washed under every accent, not under any particular
   * one, because nearly all of its text was tinted — and when every word carries
   * the accent, the accent stops lifting anything. `ink` is the fix: primary text
   * sits at near-white on the ground and the accent is spent on what should
   * actually stand out.
   *
   * Asserted rather than commented because the obvious future "tidy up" is to
   * make ink follow the theme, which would quietly undo it.
   */
  it("is not a value in any accent ramp", () => {
    const values = new Set(
      ids.flatMap((id) => Object.values(ACCENTS[id]).map((v) => v.toLowerCase())),
    );
    expect(values.has(fixedColors.ink.toLowerCase())).toBe(false);
  });

  it("clears every accent's brightest role on the ground", () => {
    // If ink were dimmer than the accent it is meant to out-rank, the hierarchy
    // inverts — the same failure the blue ramp had with the Start button.
    const dim = ids.filter((id) => luminance(fixedColors.ink) <= luminance(ACCENTS[id].bright));
    expect(dim).toEqual([]);
  });
});
