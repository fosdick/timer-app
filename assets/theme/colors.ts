// Yoga Timer App - Color Tokens
//
// Role names are unchanged (call sites depend on them); the VALUES now come from
// the shared accent ramp so the yoga tab themes with the rest of the app instead
// of carrying its own private green.
import { ACCENTS, DEFAULT_ACCENT_ID, fixedColors } from "./accent";

const accent = ACCENTS[DEFAULT_ACCENT_ID];

export const yogaColors = {
  // Primary Colors - Current Pose (Memory Trigger)
  poseCurrentIcon: accent.soft, // #81C784 current pose icon
  poseCurrentName: accent.tintStrong, // #E8F5E9 current pose name

  progressText: accent.tintStrong, // #E8F5E9 progress text

  // Secondary Colors - Instructional Cues (Support)
  instructionalText: accent.soft, // #81C784 readable instructional copy

  // Tertiary Colors - Flow/Context Info (Background)
  flowName: accent.muted, // #689F38 flow name label
  timerLabel: accent.muted, // #689F38 "Remaining" and timer labels
  currentTimeLabel: accent.muted, // #689F38 "Current Time" label

  // Functional Colors - Navigation (Visible but Supporting)
  poseNavIcon: accent.soft, // #81C784 prev/next pose icons
  poseNavIconOpacity: 1, // Apply 60% opacity to these icons

  // Active/Countdown Colors
  timerCountdown: accent.bright, // #CDDC39 active element
  timerCountdownWarning: fixedColors.warning, // #FF6F00 semantic, not themed

  // Background Colors
  backgroundPrimary: fixedColors.black, // #000000 not themed
  backgroundHeader: accent.tintStrong, // #E8F5E9
};
