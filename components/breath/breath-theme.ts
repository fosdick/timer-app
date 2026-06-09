/**
 * Shared style tokens for the breath-timer UI. Components import these instead
 * of hard-coding colours/spacing, so the look stays consistent and tweakable
 * from one place (best-practice: a small theme + co-located StyleSheet.create
 * per component).
 */
import { BreathPhaseKind } from "@/assets/data/breath-patterns";

export const breathTheme = {
  bg: "#080B0C",
  surface: "#0F1B1F",
  line: "#20323A",
  text: "#E6EEF0",
  muted: "#90A4AE",
  accent: "#0277BD",
  accentSoft: "#80DEEA",

  space: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 },
  radius: 14,

  /** Soft per-phase tint for labels/accents. */
  phaseTint: {
    inhale: "#80DEEA",
    holdIn: "#4FC3F7",
    exhale: "#A5D6A7",
    holdOut: "#4FC3F7",
  } as Record<BreathPhaseKind, string>,
};

/** mm:ss (or h:mm:ss) from a seconds value. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
