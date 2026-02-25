import { yogaColors } from "./colors";

// Font Weights
export const fontWeights = {
  light: "300",
  regular: "400",
  medium: "500",
  bold: "700",
} as const;

// Typography Scales
export const yogaTypography = {
  // Flow Name (De-emphasized)
  flowName: {
    fontSize: 18,
    fontWeight: fontWeights.regular,
    color: yogaColors.flowName,
    textAlign: "center" as const,
  },

  // Pose Name (Primary - Memory Trigger)
  poseName: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: yogaColors.poseCurrentName,
    textAlign: "center" as const,
  },

  // Instructional Cues (Secondary - Support)
  instructionalCues: {
    fontSize: 16,
    fontWeight: fontWeights.regular,
    color: yogaColors.instructionalText,
    textAlign: "center" as const,
    lineHeight: 24,
  },

  // Timer Labels
  timerLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: yogaColors.timerLabel,
    textAlign: "center" as const,
    marginTop: 20,
  },

  currentTimeLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: yogaColors.currentTimeLabel,
    textAlign: "center" as const,
  },

  // Timer Countdown (00:04)
  timerCountdown: {
    fontSize: 72,
    fontWeight: fontWeights.light,
    color: yogaColors.timerCountdown,
    textAlign: "center" as const,
    letterSpacing: -2,
  },

  // Current Time Display (1:39:19 PM)
  currentTime: {
    fontSize: 52,
    fontWeight: fontWeights.light,
    color: yogaColors.timerCountdown,
    textAlign: "center" as const,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },

  currentTimePeriod: {
    fontSize: 20,
    fontWeight: fontWeights.regular,
    color: yogaColors.timerCountdown,
  },

  // Progress Text (Superset labels like "Splits")
  progressText: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    color: yogaColors.progressText,
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
    color: yogaColors.poseNavIcon,
    textAlign: "center" as const,
    opacity: 0.6,
  },
};
