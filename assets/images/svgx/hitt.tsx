import * as React from "react";
import Svg, { Path } from "react-native-svg";

const HittSvg = (props: any) => {
  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 7.5h1.5v9H6v-9zm3 5.25V18H4.5v-1.5h-3v-9h3V6H9v5.25h6V6h4.5v1.5h3v9h-3V18H15v-5.25H9zm7.5 0v3.75H18v-9h-1.5v5.25zM4.5 9H3v6h1.5V9zm15 6H21V9h-1.5v6z"
        fill={props.color}
      />
    </Svg>
  );
};
export { HittSvg };
