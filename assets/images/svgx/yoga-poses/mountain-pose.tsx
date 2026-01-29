import * as React from "react";
import Svg, { Path, Circle, SvgProps } from "react-native-svg";

const MountainPoseSvg = (props: SvgProps) => {
  return (
    <Svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Head */}
      <Circle cx="16" cy="6" r="2.5" fill={props.color} />

      {/* Body - standing upright */}
      <Path
        fill={props.color}
        d="M16,9 L16,20 M12,12 L20,12 M13,20 L13,28 M19,20 L19,28"
        stroke={props.color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Arms at sides */}
      <Path
        fill="none"
        d="M16,10 L12,16 M16,10 L20,16"
        stroke={props.color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export { MountainPoseSvg };
