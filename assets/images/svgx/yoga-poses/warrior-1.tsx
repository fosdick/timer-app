import * as React from "react";
import Svg, { Path, Circle, SvgProps } from "react-native-svg";

const Warrior1Svg = (props: SvgProps) => {
  return (
    <Svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Head */}
      <Circle cx="16" cy="6" r="2.5" fill={props.color} />

      {/* Body in lunge position */}
      <Path
        fill={props.color}
        d="M16,9 L16,16 M10,18 L16,16 L22,20"
        stroke={props.color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arms raised overhead */}
      <Path
        fill="none"
        d="M16,9 L14,4 M16,9 L18,4"
        stroke={props.color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Legs - lunge position */}
      <Path
        fill="none"
        d="M10,18 L8,28 M22,20 L24,26"
        stroke={props.color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export { Warrior1Svg };
