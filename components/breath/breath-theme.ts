/**
 * Shared style tokens for the breath-timer UI — pulled from the app's colorTheme
 * so it matches the yoga / HIIT tabs (GreenTheme: dark background, lime active
 * numbers, olive / blue-gray labels, outline controls).
 */
import { colorTheme } from "@/assets/styles/timer-app";
import { BreathPhaseKind } from "@/assets/data/breath-patterns";

export const breathTheme = {
  bg: colorTheme.backgroundColor, //            #080B0c
  surface: "#0D110B", //                        subtle dark panel
  line: colorTheme.controlInactiveOpacity, //   rgba(84,110,122,0.3) — subtle borders
  border: colorTheme.borderColor, //            #91BD27 lime — active/control borders
  text: colorTheme.activeTimerPrimary, //       #CDDC39 lime — primary numbers
  label: colorTheme.labelPrimary, //            #689F38 olive
  muted: colorTheme.labelSecondary, //          #546E7A blue-gray
  accent: colorTheme.activeTimerPrimary, //     #CDDC39 lime
  accentSoft: colorTheme.activeTimerDimmed, //  #7CB342 muted lime
  buttonText: colorTheme.fontColor, //          #629231 green
  tintFaint: "rgba(205,220,57,0.14)", //        faint lime fill for active chips

  space: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 },
  radius: 10,

  /** Soft per-phase tint. */
  phaseTint: {
    inhale: colorTheme.activeTimerPrimary,
    holdIn: colorTheme.activeTimerDimmed,
    exhale: colorTheme.labelPrimary,
    holdOut: colorTheme.activeTimerDimmed,
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
