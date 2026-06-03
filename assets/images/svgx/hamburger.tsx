import * as React from "react";
import Svg, { Rect, SvgProps } from "react-native-svg";
import { TouchableOpacity } from "react-native";

interface HamburgerSvgProps extends SvgProps {
  onPress?: () => void;
  color?: string;
}

/**
 * Classic three-bar hamburger menu icon.
 *
 * Wrap in a TouchableOpacity so callers can provide an onPress handler.
 * Matches the 24 × 24 px footprint used by SettingsSvg.
 */
const HamburgerSvg = ({
  onPress,
  color = "#1C274C",
  ...props
}: HamburgerSvgProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.6}
    >
      <Svg
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        fill="none"
        {...props}
      >
        {/* Top bar */}
        <Rect x="3" y="5" width="18" height="2" rx="1" fill={color} />
        {/* Middle bar */}
        <Rect x="3" y="11" width="18" height="2" rx="1" fill={color} />
        {/* Bottom bar */}
        <Rect x="3" y="17" width="18" height="2" rx="1" fill={color} />
      </Svg>
    </TouchableOpacity>
  );
};

export { HamburgerSvg };
