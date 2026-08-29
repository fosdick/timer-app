/**
 * Accent themes.
 *
 * The app is one dark app with one accent family. A "colour theme" varies ONLY the
 * accent ramp below — never the ground, never the true neutrals. That is a
 * deliberate constraint (agreed 2026-08-28):
 *   - adding a theme is 13 hex values, so themes can be added casually as data;
 *   - contrast stays safe by construction, because the ground never moves;
 *   - and it matches what people mean by "colour theme" — the app's accent colour.
 *
 * Before this file there were FOUR overlapping token sources: colorTheme (named
 * after components — `thumbTintColor`, `trackColorFalse`), designColors (semantic
 * but green-only), breath-theme (best-named, breath tab only) and
 * assets/theme/colors.ts (yoga-only role names). A second theme was impossible to
 * define because "what is thumbTintColor in blue?" has no answer until you decide
 * it means `control`. All four now derive from this ramp.
 *
 * The green ramp reproduces the shipped 1.1.0 palette EXACTLY, value for value, so
 * introducing this file changes nothing on screen.
 */

/** One accent family. 13 values; everything else in the app is fixed. */
export interface Accent {
  /** Live countdowns, active/selected values. The loudest colour. */
  bright: string;
  /** Readable instructional copy and pose icons. The most-used accent. */
  soft: string;
  /** Dimmed values, links, secondary actions. */
  mid: string;
  /** Labels — "Remaining", "Current Time", field captions. */
  muted: string;
  /** Outlines and button borders. */
  border: string;
  /** Body/button text. */
  deep: string;
  /** Slider thumb, filled switch, active tab. */
  control: string;
  /** Filled portion of a slider track. */
  track: string;
  /** Empty portion of a track; also the disabled thumb. */
  trackOff: string;
  /** The light header surface — the app's one pale band. */
  tint: string;
  /** Ink drawn ON `tint`. Must stay dark: `tint` is near-white. */
  tintInk: string;
  /** Near-white tinted text on the dark ground (pose names, progress). */
  tintStrong: string;
  /** Subtle raised panel on the dark ground. */
  surface: string;
}

/**
 * `#RRGGBB` -> `rgba(r, g, b, a)`. Lets the two alpha tints in the breath theme
 * derive from the ramp instead of being separate literals — they were
 * rgba(124,179,66,0.35) and rgba(205,220,57,0.14), which are exactly `mid` and
 * `bright` at those alphas.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Composite `fg` over `bg` at `alpha` and return an OPAQUE hex.
 *
 * Needed where a translucent wash is not good enough: the header account disc has
 * to hide the grey capsule iOS 26 draws behind a headerRight view, so it must be
 * solid while still reading as a tint of the accent.
 */
export function over(fg: string, bg: string, alpha: number): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [fr, fg_, fb] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha));
  return (
    "#" +
    [mix(fr, br), mix(fg_, bg_), mix(fb, bb)]
      .map((c) => c.toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

/** GreenTheme, as shipped in 1.1.0. The logo is green, so this is the brand. */
export const GREEN: Accent = {
  bright: "#CDDC39",
  soft: "#81C784",
  mid: "#7CB342",
  muted: "#689F38",
  border: "#91BD27",
  deep: "#629231",
  control: "#4b6806",
  track: "#3C4E16",
  trackOff: "#0D2013",
  tint: "#dfffea",
  tintInk: "#080B0c",
  tintStrong: "#E8F5E9",
  surface: "#0D110B",
};

/**
 * BlueTheme, finished.
 *
 * Six values come from the `const BlueTheme = false` branch that shipped dead in
 * 1.1.0 — but they were named after components, so they had to be re-mapped to
 * roles. The mapping below is by role; the VALUES were later re-solved, because
 * the original claim here — that the mapping mirrored green's luminance — was
 * simply wrong. Measured, soft/mid/border ran ~25% brighter than green and deep
 * ~35% darker. See the note on BLUE and the calibration test:
 *   borderColor #2B9CB3 -> muted   (green's muted is mid-dark, and this matches)
 *   fontColor   #3670A5 -> deep      (re-solved to #4A89C3)
 *   thumbTint   #2D5D8B -> control
 *   minTrack    #23496C -> track
 *   trackFalse  #081D21 -> trackOff
 *   headerLite  #C3D8DB -> tint      (re-solved to #EEF9FB)
 * The remaining six are new. `bright` is #80DEEA, which is not arbitrary: the old
 * (now dead) pranayama.tsx used exactly that cyan as its accent text, so it is the
 * blue identity this app already reached for once.
 */
/**
 * Blue is green rotated in hue, NOT re-invented. Every role is held at green's
 * relative luminance (within 20%, asserted in accent-contract.test.ts) so blue
 * inherits green's contrast decisions instead of relitigating them.
 *
 * The first pass did not do this and it showed: soft/mid/border ran ~25% brighter
 * than green and deep ~35% darker, which made the pattern chips shout and left the
 * Start button — whose label is `deep` — the faintest text on the screen.
 */
export const BLUE: Accent = {
  bright: "#80DEEA",
  soft: "#76C0E2",
  mid: "#47AEDD",
  muted: "#2B9CB3",
  border: "#27BFD3",
  deep: "#4A89C3",
  control: "#2D5D8B",
  track: "#23496C",
  trackOff: "#081D21",
  tint: "#EEF9FB",
  tintInk: "#040E10",
  tintStrong: "#E1F5FE",
  surface: "#0A1014",
};

/** Every selectable accent. Adding one is a 13-value entry here plus a label. */
/**
 * LeafTheme — the heart-chakra green.
 *
 * Direction came from a plate in Jarvis's mudras book: the greens there are
 * living-foliage greens, where the shipped GREEN is closer to olive. The hues
 * were read from that page by eye and NOT sampled — it is a photograph under
 * warm light, so the page carries a yellow cast that literal sampling would bake
 * straight into the theme.
 *
 * Built to the same contract as blue: each role holds GREEN's relative luminance
 * (within 1%, asserted in accent-contract.test.ts) with the hue pulled off the
 * lime end toward true green and chroma eased to ~82% of green's, which is what
 * keeps it natural rather than synthetic. Same weight on screen, different
 * temperature.
 */
export const LEAF: Accent = {
  bright: "#B6DF88",
  soft: "#8DC494",
  mid: "#6DB55A",
  muted: "#47A34D",
  border: "#71C23A",
  deep: "#42963F",
  control: "#236D11",
  track: "#23521E",
  trackOff: "#0F1F17",
  tint: "#E7FDED",
  tintInk: "#080B0C",
  tintStrong: "#EAF4EC",
  surface: "#0C110C",
};

/**
 * TideTheme — the blue counterpart to Leaf.
 *
 * The shipped BLUE is a calibrated version of the original two-value experiment;
 * Tide is designed rather than rescued. It travels 46 degrees of hue from a
 * green-cyan `bright` to an indigo `deep`, where the shipped blue travels 13 and
 * reads as a wall of one colour. That travel is the thing green always had and
 * blue never did.
 */
export const TIDE: Accent = {
  bright: "#84E3D0",
  soft: "#8FBFC8",
  mid: "#6EACC3",
  muted: "#429DA7",
  border: "#32C2B8",
  deep: "#5B87C0",
  control: "#1861A2",
  track: "#264A72",
  trackOff: "#0F1F21",
  tint: "#E7FBFB",
  tintInk: "#080B0C",
  tintStrong: "#E9F4F5",
  surface: "#0D1013",
};

/**
 * DuskTheme — violet, and the quietest of the five.
 *
 * Purple is the one hue that goes synthetic the moment it is pushed, so its
 * chroma is capped hardest of the set. It still holds green's luminance per role,
 * so it is no dimmer on screen — only calmer.
 *
 * The first pass capped it too hard: `bright` and `soft` came out at 39 and 37
 * channel spread, i.e. near-grey, and the "hue rotation, not a greyscale" guard
 * caught them. Both were raised — and only those two — until they cleared 46
 * rather than sitting on the 40 threshold, since a value tuned to exactly pass a
 * test is a value that breaks on the next nudge.
 */
export const DUSK: Accent = {
  bright: "#F2C4F0",
  soft: "#CFAAD9",
  mid: "#BB97CC",
  muted: "#B57CC0",
  border: "#D799DC",
  deep: "#9676C0",
  control: "#7F3CBD",
  track: "#5B3682",
  trackOff: "#26162B",
  tint: "#FBF5FC",
  tintInk: "#0C0A0D",
  tintStrong: "#F5F0F7",
  surface: "#120F14",
};

export const ACCENTS = {
  green: GREEN,
  leaf: LEAF,
  blue: BLUE,
  tide: TIDE,
  dusk: DUSK,
} as const;
export type AccentId = keyof typeof ACCENTS;

/** Display names for the User Preferences picker. */
export const ACCENT_LABELS: Record<AccentId, string> = {
  green: "Green",
  leaf: "Leaf",
  blue: "Blue",
  tide: "Tide",
  dusk: "Dusk",
};

/** The brand accent, and the fallback whenever no preference is set. */
export const DEFAULT_ACCENT_ID: AccentId = "green";

/**
 * Values that are NOT themed. Collected here so it is obvious what a new accent
 * does not get to change — the ground and the true neutrals stay put, which is
 * what keeps contrast safe when accents are added as data.
 */
export const fixedColors = {
  /** The app ground. Every screen sits on this. */
  ground: "#080B0c",
  /** True black — used by a couple of legacy surfaces. */
  black: "#000000",
  white: "#FFFFFF",
  /** Blue-grey, deliberately NOT part of the accent: it reads as neutral against
   *  any accent and carries "secondary/inactive" without competing. */
  neutral: "#546E7A",
  /** Hairlines and inactive tab labels. */
  neutralDim: "#687076",
  /** Dark panels (package rows, inputs). */
  panel: "#1a1a1a",
  panelRaised: "#2a2a2a",
  panelSunken: "#262626",
  /** Semantic, never themed. */
  warning: "#FF6F00",
  danger: "red",
} as const;
