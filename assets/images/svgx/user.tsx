import * as React from "react";
import Svg, { Circle, Path, SvgProps } from "react-native-svg";

/**
 * Pronoun glyph for the header account button.
 *
 * Three things are deliberate:
 *
 *  - `they` is the DEFAULT. Someone who never opens preferences gets the neutral
 *    glyph, not a guess.
 *  - The three read as one family: same head, same bounding box, same weight. The
 *    difference is HAIR SILHOUETTE plus shoulder width, not costume. Hair is the
 *    only cue that survives 24px without becoming a restroom pictogram — the first
 *    version varied torso taper alone and all three read identically on device.
 *  - The colour is FIXED per pronoun and is NOT part of the accent theme. It is the
 *    one mark on screen that says something about the person rather than about the
 *    app, so recolouring the app must not recolour them. The disc BEHIND the glyph
 *    is themed; the person is not. That split is the whole idea.
 */
export type Pronoun = "she" | "they" | "he";

export const PRONOUNS: Pronoun[] = ["she", "they", "he"];

export const PRONOUN_LABELS: Record<Pronoun, string> = {
  she: "she",
  they: "they",
  he: "he",
};

/**
 * Rose / olive / steel — three distinct hues rather than two blues and a pink,
 * which is what the first set amounted to (`they` #3E4A5C and `he` #2F4C68 were
 * both slate). All deep and desaturated: subtle, but subtle on PURPOSE, and
 * legible on the pale header. Frozen by pronoun.test.ts.
 */
export const PRONOUN_COLORS: Record<Pronoun, string> = {
  she: "#74495B", // deep rose
  they: "#4E5346", // warm olive-grey — reads as neither, not as "unstyled"
  he: "#2F4C68", // deep steel
};

/**
 * Hair, drawn BEHIND the head in the same fill so the two merge into a single
 * silhouette. `they` has none — a plain round crown is the neutral baseline.
 */
const HAIR: Record<Pronoun, string | null> = {
  // Bob: crown plus two curtains falling past the jaw and outside the head circle.
  she: "M12 2.9 C8.6 2.9 6.9 5.1 6.9 8.2 L6.9 13.1 Q6.9 13.9 7.7 13.9 Q8.6 13.9 8.6 12.9 L8.6 8.2 Q8.6 6 12 6 Q15.4 6 15.4 8.2 L15.4 12.9 Q15.4 13.9 16.3 13.9 Q17.1 13.9 17.1 13.1 L17.1 8.2 C17.1 5.1 15.4 2.9 12 2.9 Z",
  they: null,
  // Short crop that wraps down to the temples, so the silhouette gains contour
  // rather than sitting a flat slab on the crown.
  //
  // Plot the three on a minimal-to-detailed axis and they should read as a U:
  // `she` and `he` both carry two features (shaped hair plus a distinct torso),
  // `they` sits alone at the bottom with neither. The flat cap made it a
  // downward slope instead — `he` was reading as MORE neutral than `they`, which
  // is the opposite of what a neutral default should mean.
  he: "M7.9 10.4 L7.9 5.4 Q7.9 3.2 12 3.2 Q16.1 3.2 16.1 5.4 L16.1 10.4 Q16.1 8.2 15.2 7.6 Q13.8 6.6 12 6.6 Q10.2 6.6 8.8 7.6 Q7.9 8.2 7.9 10.4 Z",
};

/** Torsos. Same base width and same hem; only the shoulder line differs. */
const TORSO: Record<Pronoun, string> = {
  // Narrow shoulders, steady flare to the hem.
  she: "M9 14 L15 14 Q15.9 14 16.2 14.8 L18.8 19.6 Q19.2 20.5 18.3 20.5 L5.7 20.5 Q4.8 20.5 5.2 19.6 L7.8 14.8 Q8.1 14 9 14 Z",
  // Neutral trapezoid — the original glyph.
  they: "M8.5 14 L15.5 14 Q16.4 14 16.7 14.8 L18.6 19.6 Q18.9 20.5 18 20.5 L6 20.5 Q5.1 20.5 5.4 19.6 L7.3 14.8 Q7.6 14 8.5 14 Z",
  // Broad, near-straight sides.
  he: "M7.4 14 L16.6 14 Q17.5 14 17.7 14.8 L18.3 19.6 Q18.5 20.5 17.6 20.5 L6.4 20.5 Q5.5 20.5 5.7 19.6 L6.3 14.8 Q6.5 14 7.4 14 Z",
};

export const UserSvg = ({
  pronoun = "they",
  color,
  ...props
}: SvgProps & { pronoun?: Pronoun; color?: string }) => {
  // `color` still wins when passed, so any caller that wants a specific tone can
  // have one; otherwise the pronoun decides.
  const fill = color ?? PRONOUN_COLORS[pronoun];
  const hair = HAIR[pronoun];
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {hair ? <Path d={hair} fill={fill} /> : null}
      <Circle cx={12} cy={7.5} r={4} fill={fill} />
      <Path d={TORSO[pronoun]} fill={fill} />
    </Svg>
  );
};
