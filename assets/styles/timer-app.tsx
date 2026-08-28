import { StyleSheet } from "react-native";
import type { CustomTimerPickerModalStyles } from "react-native-timer-picker";

// Colour comes from ONE accent ramp (assets/theme/accent.ts). The old
// `const BlueTheme = false` / if-else branch is gone: it named tokens after the
// components that used them (`thumbTintColor`, `trackColorFalse`), which is why a
// second theme could never be finished — "what is thumbTintColor in blue?" has no
// answer until you decide it means `control`. The names below are kept as-is so no
// call site changes; each now points at a role in the ramp.
//
// This is a pure refactor: every value resolves to exactly what 1.1.0 shipped.
import { ACCENTS, DEFAULT_ACCENT_ID, fixedColors, withAlpha } from "@/assets/theme/accent";

const accent = ACCENTS[DEFAULT_ACCENT_ID];

const fontColor = accent.deep; //                       #629231
const borderColor = accent.border; //                   #91BD27
const thumbTintColor = accent.control; //               #4b6806
const trackColorFalse = accent.trackOff; //             #0D2013
const minimumTrackTintColor = accent.track; //          #3C4E16
const thumbColorDisabled = accent.trackOff; //          was = trackColorFalse
const maximumTrackTintColor = accent.control; //        was = thumbTintColor
const backgroundColor = fixedColors.ground; //          #080B0c — NOT themed
const headerLiteShade = accent.tint; //                 #dfffea
const headerInk = accent.tintInk; //                    #080B0c
const tabBarActiveTintColor = accent.control; //        was = thumbTintColor
const tabBarInActiveTintColor = fixedColors.neutralDim; // #687076 — NOT themed

// New Design System Colors
export const designColors = {
  // Primary - Active elements
  activeTimerPrimary: accent.bright, //      #CDDC39 Bright Lime - main countdowns
  activeNumberSecondary: accent.bright, //   same - configuration numbers

  // Secondary - Dimmed elements
  activeTimerDimmed: accent.mid, //          #7CB342 Muted Lime - HIIT inactive timer

  // Tertiary - Labels
  labelPrimary: accent.muted, //             #689F38 Muted Olive - standard labels
  labelSecondary: fixedColors.neutral, //    #546E7A Blue-Gray - NOT themed

  // Interactive Controls
  controlActive: accent.bright, //           slider fill, switch on
  controlInactive: fixedColors.neutral, //   slider track, switch off - NOT themed
  controlInactiveOpacity: withAlpha(fixedColors.neutral, 0.3), // was rgba(84,110,122,0.3)

  // Backgrounds
  backgroundPrimary: fixedColors.black, //   #000000 - NOT themed
  backgroundHeader: accent.tintStrong, //    #E8F5E9 (currently unreferenced)
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
  headerInk,
  tabBarActiveTintColor,
  tabBarInActiveTintColor,
  // Add new design system colors
  ...designColors,
};

/**
 * Shared style for EVERY react-native-timer-picker wheel in the app (breath
 * counts, session length, count-in, yoga pace, HIIT). One definition so all the
 * wheels read identically and their Confirm/Cancel buttons match the app's
 * bordered button standard (same palette as the rounds popup). Import this and
 * pass it as the picker's `styles` prop rather than re-styling per call site.
 */
// Matches the rounds popup (SessionLengthModal): an "off grey" dark panel with
// blacker buttons. PICKER_SURFACE mirrors breath-theme's `surface` token; the
// blacker button fill reads as distinct against it.
const PICKER_SURFACE = "#0D110B"; // breath-theme surface — the rounds popup card
const PICKER_BUTTON_BG = "#000000"; // "more black" than the panel
const PICKER_HAIRLINE = "rgba(124, 179, 66, 0.35)"; // breath-theme line

const pickerButtonBase = {
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 28,
  paddingVertical: 12,
  fontSize: 18,
  fontWeight: "600" as const,
  letterSpacing: 1,
  overflow: "hidden" as const,
  backgroundColor: PICKER_BUTTON_BG,
};

export const timerPickerModalStyles: CustomTimerPickerModalStyles = {
  theme: "dark",
  // Drives the wheel area AND its gradient fade, so the fade blends cleanly.
  backgroundColor: PICKER_SURFACE,
  container: {
    backgroundColor: PICKER_SURFACE,
    borderWidth: 1,
    borderColor: PICKER_HAIRLINE,
    borderRadius: 14,
  },
  // Wheel digits + unit labels in the app's lime (matching the rounds popup
  // value) instead of the library's default white.
  pickerItem: { color: colorTheme.activeTimerPrimary },
  pickerLabel: { color: colorTheme.activeTimerDimmed },
  // Title matches the rounds popup heading (lime, 20/600, letter-spaced).
  modalTitle: {
    color: colorTheme.activeTimerPrimary,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 1,
  },
  confirmButton: {
    ...pickerButtonBase,
    color: colorTheme.fontColor,
    borderColor: colorTheme.borderColor,
  },
  cancelButton: {
    ...pickerButtonBase,
    color: colorTheme.activeTimerDimmed,
    borderColor: PICKER_HAIRLINE,
  },
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
    minWidth: 160,
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
  },
  // Light-green variant for the Stop/Resume states (shared across all tabs).
  startButtonEngaged: {
    borderColor: colorTheme.activeTimerDimmed,
    color: colorTheme.activeTimerDimmed,
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
  // Shared layout styles for consistent button positioning
  contentContainer: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 80, // Fixed spacing above banner
    alignItems: "center",
    width: "100%",
  },
});
