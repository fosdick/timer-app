import { useWindowDimensions } from "react-native";

/**
 * Layout tier for the breath screen, by available space (NOT "iPhone vs iPad").
 * Rotation-aware via useWindowDimensions. Thresholds are tuned by eye on device.
 *   compact  — short screens (iPhone SE/6/7/8, mini, landscape phones): setup
 *              moves into the slide-up sheet, type scales down, focus run view.
 *   regular  — most modern iPhones: the full on-screen layout.
 *   expanded — iPads / very tall or wide screens: capped width + breathe ring.
 */
export type LayoutTier = "compact" | "regular" | "expanded";

export function useLayoutTier(): LayoutTier {
  const { width, height } = useWindowDimensions();
  if (width >= 700 || height >= 950) return "expanded";
  if (height < 700) return "compact";
  return "regular";
}
