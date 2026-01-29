import { yogaColors } from "./colors";

// Font Weights
export const fontWeights = {
  light: "300",
  regular: "400",
  medium: "500",
  bold: "700",
};

// Typography Scales
export const yogaTypography = {
  // Flow Name (De-emphasized)
  flowName: {
    fontSize: 18,
    fontWeight: fontWeights.regular,
    color: yogaColors.flowName,
    textAlign: "center",
  },

  // Pose Name (Primary - Memory Trigger)
  poseName: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: yogaColors.poseCurrentName,
    textAlign: "center",
  },

  // Instructional Cues (Secondary - Support)
  instructionalCues: {
    fontSize: 16,
    fontWeight: fontWeights.regular,
    color: yogaColors.instructionalText,
    textAlign: "center",
    lineHeight: 24,
  },

  // Timer Labels
  timerLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: yogaColors.timerLabel,
    textAlign: "center",
    marginTop: 20,
  },

  currentTimeLabel: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: yogaColors.currentTimeLabel,
    textAlign: "center",
  },

  // Timer Countdown (00:04)
  timerCountdown: {
    fontSize: 72,
    fontWeight: fontWeights.light,
    color: yogaColors.timerCountdown,
    textAlign: "center",
    letterSpacing: -2,
  },

  // Current Time Display (1:39:19 PM)
  currentTime: {
    fontSize: 52,
    fontWeight: fontWeights.light,
    color: yogaColors.timerCountdown,
    textAlign: "center",
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
    textAlign: "center",
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
    textAlign: "center",
    opacity: 0.6,
  },
};
