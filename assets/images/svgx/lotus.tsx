import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

import { lotus } from "@/assets/data/lotus";

/**
 * Tab icon for Meditation: the same ten-petal lotus the breath visual draws,
 * from the same geometry module, so the mark and the animation cannot drift
 * apart.
 *
 * A flower rather than a figure on purpose — Pranayama's icon is a seated
 * person, and two seated people in one tab bar would be indistinguishable at
 * 28px. This also frees Pranayama to keep the icon it already has.
 */
const PETALS = lotus();

export const LotusSvg = ({ color = "#000", ...props }: SvgProps & { color?: string }) => (
  <Svg width={28} height={28} viewBox="-58 -58 116 116" fill="none" {...props}>
    {PETALS.map((p, i) => (
      <Path
        key={i}
        d={p.d}
        fill="none"
        stroke={color}
        strokeWidth={4}
        transform={`rotate(${p.angle})`}
      />
    ))}
  </Svg>
);
