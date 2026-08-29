import type { TextStyle } from "react-native";
import { yogaColors, makeYogaColors, type YogaColors } from "./colors";
import { ACCENTS, DEFAULT_ACCENT_ID, type Accent } from "./accent";

// Font Weights
export const fontWeights = {
  /** Toned display numerals — the Remaining countdown. Deliberately lighter than
   *  `light`: at 72px a 300 still reads loud in a dark room. */
  thin: "200",
  light: "300",
  regular: "400",
  medium: "500",
  bold: "700",
} as const;

// Typography Scales — typed as TextStyle so consumers spreading these
// into StyleSheet.create get TextStyle-compatible values back.
export function makeYogaTypography(accent: Accent, c: YogaColors): Record<string, TextStyle> {
  return {
  // Flow Name (De-emphasized)
  flowName: {
    fontSize: 18,
    fontWeight: fontWeights.regular,
    color: c.flowName,
    textAlign: "center" as const,
  },

  // Pose Name (Primary - Memory Trigger)
  poseName: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: c.poseCurrentName,
    textAlign: "center" as const,
  },

  // Instructional Cues (Secondary - Support)
  instructionalCues: {
    fontSize: 16,
    fontWeight: fontWeights.regular,
    color: c.instructionalText,
    textAlign: "center" as const,
    lineHeight: 24,
  },

  // Timer Labels
  timerLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: c.timerLabel,
    textAlign: "center" as const,
    marginTop: 20,
  },

  currentTimeLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: c.currentTimeLabel,
    textAlign: "center" as const,
  },

  // Timer Countdown (00:04)
  // Toned 2026-08-28 at the user's call ("screen is too bright to my eye"): was
  // 300 weight in accent.bright. The countdown is glanceable context during a
  // practice, not the loudest thing in the room. Weight lives here rather than in
  // the accent so every present and future accent inherits the same restraint —
  // themes differ in HUE, not in weight or brightness.
  timerCountdown: {
    fontSize: 72,
    fontWeight: fontWeights.thin,
    color: accent.muted,
    textAlign: "center" as const,
    letterSpacing: -2,
  },

  // Current Time Display (1:39:19 PM)
  // Toned with the countdown: the wall clock is ancillary context, and leaving it
  // at accent.bright made it the loudest thing on the Yoga tab — louder than the
  // practice timer directly above it.
  currentTime: {
    fontSize: 52,
    fontWeight: fontWeights.thin,
    color: accent.muted,
    textAlign: "center" as const,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },

  currentTimePeriod: {
    fontSize: 20,
    fontWeight: fontWeights.regular,
    color: accent.muted,
  },

  // Progress Text (Superset labels like "Splits")
  progressText: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    color: c.progressText,
    textAlign: "center" as const,
    opacity: 0.8,
    lineHeight: 20,
    marginTop: 10,
  },
  progressTextLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
  },
  // Prev/Next Pose Labels
  poseNavLabel: {
    fontSize: 12,
    fontWeight: fontWeights.regular,
    color: c.poseNavIcon,
    textAlign: "center" as const,
    opacity: 0.6,
  },
  };
}

/** Green instance, for components not yet reading the hook. */
export const yogaTypography = makeYogaTypography(ACCENTS[DEFAULT_ACCENT_ID], yogaColors);

