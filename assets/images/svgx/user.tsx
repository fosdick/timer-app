import * as React from "react";
import Svg, { Circle, Path, SvgProps } from "react-native-svg";

/**
 * Generic "user" glyph for the header menu (replaces the settings gear). A round
 * head over a trapezoidal torso — the standard account/avatar silhouette. Color
 * is configurable via `color` (defaults to the dark tone the gear used).
 */
export const UserSvg = ({
  color = "#1C274C",
  ...props
}: SvgProps & { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    {/* head */}
    <Circle cx={12} cy={7.5} r={4} fill={color} />
    {/* trapezoidal torso — narrower at the shoulders, flaring to the base */}
    <Path
      d="M8.5 14 L15.5 14 Q16.4 14 16.7 14.8 L18.6 19.6 Q18.9 20.5 18 20.5 L6 20.5 Q5.1 20.5 5.4 19.6 L7.3 14.8 Q7.6 14 8.5 14 Z"
      fill={color}
    />
  </Svg>
);
