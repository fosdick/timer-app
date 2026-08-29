import * as React from "react";
import Svg, { Circle, Path, SvgProps } from "react-native-svg";

/**
 * Generic "user" glyph for the header menu. A round head over a torso.
 *
 * The user picks a pronoun in User Preferences and this glyph follows it. Three
 * things are deliberate:
 *
 *  - The three silhouettes share the SAME head and the same bounding box, and
 *    differ only in the torso outline. They read as one family at 24px rather than
 *    as three different icons, and none of them is a caricature.
 *  - `they` is the DEFAULT. Someone who never opens preferences gets the neutral
 *    glyph, not a guess.
 *  - The colour is FIXED per pronoun and is NOT part of the accent theme. It is the
 *    one thing on screen that says something about the person rather than about the
 *    app, so it should not move when they change the app's colour. The tones are
 *    deep and desaturated so they read on the pale header circle and stay quiet —
 *    "subtly pronoun typed", not a flag.
 */
export type Pronoun = "she" | "they" | "he";

export const PRONOUNS: Pronoun[] = ["she", "they", "he"];

export const PRONOUN_LABELS: Record<Pronoun, string> = {
  she: "she",
  they: "they",
  he: "he",
};

/** Fixed, never themed. Deep + desaturated so they sit quietly on the header. */
export const PRONOUN_COLORS: Record<Pronoun, string> = {
  she: "#6E4A5E", // deep muted rose
  they: "#3E4A5C", // deep neutral slate
  he: "#2F4C68", // deep muted steel
};

/** Torso outlines. Same shoulders and same base width; only the taper differs. */
const TORSO: Record<Pronoun, string> = {
  // Flared — widens steadily from the shoulders.
  she: "M9 14 L15 14 Q15.9 14 16.2 14.8 L18.8 19.6 Q19.2 20.5 18.3 20.5 L5.7 20.5 Q4.8 20.5 5.2 19.6 L7.8 14.8 Q8.1 14 9 14 Z",
  // Neutral trapezoid — the original glyph.
  they: "M8.5 14 L15.5 14 Q16.4 14 16.7 14.8 L18.6 19.6 Q18.9 20.5 18 20.5 L6 20.5 Q5.1 20.5 5.4 19.6 L7.3 14.8 Q7.6 14 8.5 14 Z",
  // Squarer — broader shoulders, near-straight sides.
  he: "M7.8 14 L16.2 14 Q17.1 14 17.3 14.8 L18.2 19.6 Q18.4 20.5 17.5 20.5 L6.5 20.5 Q5.6 20.5 5.8 19.6 L6.7 14.8 Q6.9 14 7.8 14 Z",
};

export const UserSvg = ({
  pronoun = "they",
  color,
  ...props
}: SvgProps & { pronoun?: Pronoun; color?: string }) => {
  // `color` still wins when passed, so any caller that wants a specific tone can
  // have one; otherwise the pronoun decides.
  const fill = color ?? PRONOUN_COLORS[pronoun];
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* head — identical across all three */}
      <Circle cx={12} cy={7.5} r={4} fill={fill} />
      <Path d={TORSO[pronoun]} fill={fill} />
    </Svg>
  );
};
