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
import { ACCENTS, DEFAULT_ACCENT_ID, fixedColors, withAlpha, type Accent } from "@/assets/theme/accent";

export function makeDesignColors(accent: Accent) {
  return {
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
};;
}

export function makeColorTheme(accent: Accent) {
  const fontColor = accent.deep;
  const borderColor = accent.border;
  const outline = accent.muted;
  const thumbTintColor = accent.control;
  const trackColorFalse = accent.trackOff;
  const minimumTrackTintColor = accent.track;
  const thumbColorDisabled = accent.trackOff;
  const maximumTrackTintColor = accent.control;
  const backgroundColor = fixedColors.ground;
  const headerLiteShade = accent.tint;
  const headerInk = accent.tintInk;
  const tabBarActiveTintColor = accent.control;
  const tabBarInActiveTintColor = fixedColors.neutralDim;
  return {
    fontColor,
    borderColor,
    outline,
    thumbTintColor,
    trackColorFalse,
    minimumTrackTintColor,
    thumbColorDisabled,
    maximumTrackTintColor,
    backgroundColor,
    headerLiteShade,
    headerInk,
    tabBarActiveTintColor,
    tabBarInActiveTintColor,
    ...makeDesignColors(accent),
    /** The raw ramp, for factories that need a role the named tokens don't cover. */
    accent,
  };
}

export type AppColorTheme = ReturnType<typeof makeColorTheme>;

/** Green instance, for components not yet reading the hook. */
export const colorTheme = makeColorTheme(ACCENTS[DEFAULT_ACCENT_ID]);
export const designColors = makeDesignColors(ACCENTS[DEFAULT_ACCENT_ID]);




/**
 * Shared style for EVERY react-native-timer-picker wheel in the app (breath
 * counts, session length, count-in, yoga pace, HIIT). One definition so all the
 * wheels read identically and their Confirm/Cancel buttons match the app's
 * bordered button standard (same palette as the rounds popup). Import this and
 * pass it as the picker's `styles` prop rather than re-styling per call site.
 */
// Matches the rounds popup (SessionLengthModal): an "off grey" dark panel with
// blacker buttons. pickerSurface(ACCENTS[DEFAULT_ACCENT_ID]) mirrors breath-theme's `surface` token; the
// blacker button fill reads as distinct against it.
const pickerSurface = (a: Accent) => a.surface; //      breath-theme surface
const PICKER_BUTTON_BG = "#000000"; // "more black" than the panel
const pickerHairline = (a: Accent) => withAlpha(a.mid, 0.35); // breath-theme line

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

export const makeTimerPickerModalStyles = (c: AppColorTheme): CustomTimerPickerModalStyles =>
  ({
  theme: "dark",
  // Drives the wheel area AND its gradient fade, so the fade blends cleanly.
  backgroundColor: pickerSurface(c.accent),
  container: {
    backgroundColor: pickerSurface(c.accent),
    borderWidth: 1,
    borderColor: pickerHairline(c.accent),
    borderRadius: 14,
  },
  // Wheel digits + unit labels in the app's lime (matching the rounds popup
  // value) instead of the library's default white.
  pickerItem: { color: c.activeTimerPrimary },
  pickerLabel: { color: c.activeTimerDimmed },
  // Title matches the rounds popup heading (lime, 20/600, letter-spaced).
  modalTitle: {
    color: c.activeTimerPrimary,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 1,
  },
  confirmButton: {
    ...pickerButtonBase,
    color: c.fontColor,
    borderColor: c.borderColor,
  },
  cancelButton: {
    ...pickerButtonBase,
    color: c.activeTimerDimmed,
    borderColor: pickerHairline(c.accent),
  },
});
export const timerPickerModalStyles: CustomTimerPickerModalStyles = makeTimerPickerModalStyles(colorTheme);

export const Settings = StyleSheet.create({
  regText: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 25,
    overflow: "hidden",
    borderColor: colorTheme.borderColor,
    color: colorTheme.fontColor,
    fontVariant: ["tabular-nums"],
  },
});

export const makeTimerStyles = (c: AppColorTheme) =>
  StyleSheet.create({
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
    borderColor: c.borderColor,
    color: c.fontColor,
    fontVariant: ["tabular-nums"],
  },
  timerFaceSmall: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 55,
    overflow: "hidden",
    borderColor: c.borderColor,
    color: c.fontColor,
    fontVariant: ["tabular-nums"],
  },
  timePicker: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    overflow: "hidden",
    borderColor: c.borderColor,
    color: c.fontColor,
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
    borderColor: c.borderColor,
    color: c.fontColor,
  },
  // Light-green variant for the Stop/Resume states (shared across all tabs).
  startButtonEngaged: {
    borderColor: c.activeTimerDimmed,
    color: c.activeTimerDimmed,
  },
  metronome: {
    // marginTop: 15,
    paddingVertical: 5,
    paddingHorizontal: 18,
    fontSize: 16,
    overflow: "hidden",
    borderColor: c.borderColor,
    color: c.fontColor,
  },
  metronomeMedium: {
    marginTop: 0,
    paddingVertical: 5,
    paddingHorizontal: 18,
    fontSize: 30,
    overflow: "hidden",
    borderColor: c.borderColor,
    color: c.fontColor,
    fontVariant: ["tabular-nums"],
  },
  valueText: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: 400,
    overflow: "hidden",
    borderColor: c.borderColor,
    color: c.fontColor,
  },
  small: {
    fontSize: 16,
  },
});
export const TimerStyles = makeTimerStyles(colorTheme);

// Pranayama Screen Styles
export const makePranayamaStyles = (c: AppColorTheme) =>
  StyleSheet.create({
  mainCountdown: {
    fontSize: 72,
    fontWeight: "300",
    color: c.activeTimerPrimary,
    textAlign: "center",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  mainLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: c.labelPrimary,
    textAlign: "center",
  },
  metronomeCount: {
    fontSize: 56,
    fontWeight: "400",
    color: c.activeTimerPrimary,
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
    color: c.labelPrimary,
    textAlign: "center",
    marginBottom: 30,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: c.labelPrimary,
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
export const PranayamaStyles = makePranayamaStyles(colorTheme);

// HIIT Screen Styles
export const makeHiitStyles = (c: AppColorTheme) =>
  StyleSheet.create({
  activeTimer: {
    fontSize: 72,
    fontWeight: "300",
    color: c.activeTimerPrimary,
    textAlign: "center",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  inactiveTimer: {
    fontSize: 72,
    fontWeight: "300",
    color: c.activeTimerDimmed,
    textAlign: "center",
    letterSpacing: -2,
    opacity: 0.6,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: c.labelPrimary,
    textAlign: "center",
  },
  roundsNumber: {
    fontSize: 56,
    fontWeight: "400",
    color: c.activeTimerPrimary,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  roundsLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: c.labelPrimary,
    textAlign: "center",
  },
  totalTime: {
    fontSize: 52,
    fontWeight: "300",
    color: c.activeTimerPrimary,
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
export const HiitStyles = makeHiitStyles(colorTheme);

export const makeScreenStyles = (c: AppColorTheme) =>
  StyleSheet.create({
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
export const screenStyles = makeScreenStyles(colorTheme);
