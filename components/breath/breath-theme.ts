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
  line: "rgba(124, 179, 66, 0.35)", //          light green @35% — subtle borders (match yoga/HIIT greens)
  border: colorTheme.borderColor, //            #91BD27 lime — active/control borders
  text: colorTheme.activeTimerPrimary, //       #CDDC39 lime — primary numbers
  label: colorTheme.labelPrimary, //            #689F38 olive
  muted: colorTheme.activeTimerDimmed, //       #7CB342 light green — inactive/secondary (was blue-gray)
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

/** Always HH:MM:SS with leading zeros (e.g. 01:10:00, 00:05:00). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
