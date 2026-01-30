import { StyleSheet } from "react-native";

const BlueTheme = false;
const GreenTheme = !BlueTheme;

let borderColor,
  fontColor,
  trackColorFalse,
  thumbTintColor,
  thumbColorDisabled,
  minimumTrackTintColor,
  maximumTrackTintColor,
  backgroundColor,
  headerLiteShade,
  tabBarActiveTintColor,
  tabBarInActiveTintColor;

if (BlueTheme) {
  fontColor = "#3670A5";
  borderColor = "#2B9CB3";
  thumbTintColor = "#2D5D8B";
  trackColorFalse = "#081D21";
  minimumTrackTintColor = "#23496C";
  thumbColorDisabled = trackColorFalse;
  maximumTrackTintColor = thumbTintColor;
  backgroundColor = "#040E10";
  headerLiteShade = "#C3D8DB";
  tabBarActiveTintColor = thumbTintColor;
  tabBarInActiveTintColor = "#687076";
} else if (GreenTheme) {
  fontColor = "#629231";
  borderColor = "#91BD27";
  thumbTintColor = "#4b6806";
  trackColorFalse = "#0D2013";
  minimumTrackTintColor = "#3C4E16";
  thumbColorDisabled = trackColorFalse;
  maximumTrackTintColor = thumbTintColor;
  backgroundColor = "#080B0c";
  headerLiteShade = "#dfffea";
  tabBarActiveTintColor = thumbTintColor;
  tabBarInActiveTintColor = "#687076";
}

// New Design System Colors
export const designColors = {
  // Primary - Active elements
  activeTimerPrimary: "#CDDC39", // Bright Lime - main countdowns
  activeNumberSecondary: "#CDDC39", // Same - configuration numbers

  // Secondary - Dimmed elements
  activeTimerDimmed: "#7CB342", // Muted Lime - HIIT inactive timer

  // Tertiary - Labels
  labelPrimary: "#689F38", // Muted Olive - standard labels
  labelSecondary: "#546E7A", // Blue-Gray - subtle labels

  // Interactive Controls
  controlActive: "#CDDC39", // Slider fill, switch on
  controlInactive: "#546E7A", // Slider track, switch off
  controlInactiveOpacity: "rgba(84, 110, 122, 0.3)", // 30% opacity version

  // Backgrounds
  backgroundPrimary: "#000000",
  backgroundHeader: "#E8F5E9",
};

export const colorTheme = {
  borderColor,
  fontColor,
  trackColorFalse,
  thumbTintColor,
  thumbColorDisabled,
  minimumTrackTintColor,
  maximumTrackTintColor,
  backgroundColor,
  headerLiteShade,
  tabBarActiveTintColor,
  tabBarInActiveTintColor,
  // Add new design system colors
  ...designColors,
};

export const Settings = StyleSheet.create({
  regText: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 25,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
  },
});

export const TimerStyles = StyleSheet.create({
  vertBox: {
    // flex: 1,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    verticalAlign: "middle",
  },
  marginTop: {
    marginTop: 10,
  },
  marginTopXL: {
    marginTop: 70,
  },
  metronomeTheme: {
    // backgroundColor: '#DBD6D2',
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  timerFace: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 85,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
  },
  timerFaceSmall: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 55,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
  },
  timePicker: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
  },
  startButton: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
  },
  metronome: {
    // marginTop: 15,
    paddingVertical: 5,
    paddingHorizontal: 18,
    fontSize: 16,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
  },
  metronomeMedium: {
    marginTop: 0,
    paddingVertical: 5,
    paddingHorizontal: 18,
    fontSize: 30,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
  },
  valueText: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: 400,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
  },
  small: {
    fontSize: 16,
  },
});

// Pranayama Screen Styles
export const PranayamaStyles = StyleSheet.create({
  mainCountdown: {
    fontSize: 72,
    fontWeight: "300",
    color: "#CDDC39",
    textAlign: "center",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  mainLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#689F38",
    textAlign: "center",
  },
  metronomeCount: {
    fontSize: 56,
    fontWeight: "400",
    color: "#CDDC39",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    marginBottom: 16, // Tighten connection to slider
  },
  metronomeCountContainer: {
    width: "80%",
    alignSelf: "center",
    marginBottom: 40,
    marginTop: 40,
  },
  metronomeLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#689F38",
    textAlign: "center",
    marginBottom: 30,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#689F38",
    textAlign: "center",
  },
  sliderContainer: {
    width: "80%",
    alignSelf: "center",
  },
  toggleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12, // Space before Start button
    marginTop: 36,
  },
  toggleSwitch: {
    marginBottom: 12, // Space between toggle and its label
    justifyContent: "center",
  },
});

// HIIT Screen Styles
export const HiitStyles = StyleSheet.create({
  activeTimer: {
    fontSize: 72,
    fontWeight: "300",
    color: "#CDDC39",
    textAlign: "center",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  inactiveTimer: {
    fontSize: 72,
    fontWeight: "300",
    color: "#7CB342",
    textAlign: "center",
    letterSpacing: -2,
    opacity: 0.6,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#689F38",
    textAlign: "center",
  },
  roundsNumber: {
    fontSize: 56,
    fontWeight: "400",
    color: "#CDDC39",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  roundsLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#689F38",
    textAlign: "center",
  },
  totalTime: {
    fontSize: 52,
    fontWeight: "300",
    color: "#CDDC39",
    textAlign: "center",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#546E7A",
    textAlign: "center",
  },
});

export const screenStyles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  BannerAdBottom: {
    position: "absolute",
    margin: 0,
    padding: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewBody: {
    flex: 1,
  },
});
