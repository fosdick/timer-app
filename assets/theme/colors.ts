// Yoga Timer App - Color Tokens

export const yogaColors = {
  // Primary Colors - Current Pose (Memory Trigger)
  poseCurrentIcon: "#81C784", // Soft Green - current pose icon (matches SVG default)
  poseCurrentName: "#E8F5E9", // White - current pose name (bold weight)

  progressText: "#E8F5E9", // White - progress text like "Superset" (bold weight)

  // Secondary Colors - Instructional Cues (Support)
  instructionalText: "#81C784", // Soft Sage - readable instructional copy

  // Tertiary Colors - Flow/Context Info (Background)
  flowName: "#689F38", // Muted Olive - flow name label
  timerLabel: "#689F38", // Same - "Remaining" and timer labels
  currentTimeLabel: "#689F38", // Same - "Current Time" label

  // Functional Colors - Navigation (Visible but Supporting)
  poseNavIcon: "#81C784", // Soft Green - prev/next pose icons (matches SVG default)
  poseNavIconOpacity: 1, // Apply 60% opacity to these icons

  // Active/Countdown Colors
  timerCountdown: "#CDDC39", // Matches current pose - active element
  timerCountdownWarning: "#FF6F00", // Optional - if under 10 seconds

  // Background Colors
  backgroundPrimary: "#000000", // True Black - main background
  backgroundHeader: "#E8F5E9", // Mint - keep existing header
};
