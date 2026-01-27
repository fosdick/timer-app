import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

const DownwardDogSvg = (props: any) => {
  return (
    <Svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Head */}
      <Circle cx="8" cy="20" r="2" fill={props.color} />

      {/* Inverted V shape - downward dog pose */}
      <Path
        fill="none"
        d="M6,22 L14,10 L22,22"
        stroke={props.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arms and legs */}
      <Path
        fill="none"
        d="M6,22 L4,26 M22,22 L24,26"
        stroke={props.color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export { DownwardDogSvg };
