/**
 * Shared style tokens for the breath-timer UI — pulled from the app's colorTheme
 * so it matches the yoga / HIIT tabs (GreenTheme: dark background, lime active
 * numbers, olive / blue-gray labels, outline controls).
 */
import { useMemo } from "react";
import { BreathPhaseKind } from "@/assets/data/breath-patterns";
import { ACCENTS, DEFAULT_ACCENT_ID, fixedColors, withAlpha, type Accent } from "@/assets/theme/accent";
import { useAccent } from "@/components/user-preferences-context";

/**
 * Breath-tab tokens for a given accent.
 *
 * Values previously read through colorTheme (which is frozen to green at module
 * load); they now come straight from the accent so this theme can vary. Green
 * resolves identically — accent-parity.test.ts asserts every value.
 */
export function makeBreathTheme(accent: Accent) {
  return {
    bg: fixedColors.ground, //                    #080B0c — NOT themed
    surface: accent.surface, //                   #0D110B subtle dark panel
    line: withAlpha(accent.mid, 0.35), //         light green @35% — subtle borders
    border: accent.border, //                     #91BD27 — active/control borders
    text: accent.bright, //                       #CDDC39 — primary numbers
    label: accent.muted, //                       #689F38
    muted: accent.mid, //                         #7CB342 — inactive/secondary
    accent: accent.bright, //                     #CDDC39
    accentSoft: accent.mid, //                    #7CB342
    buttonText: accent.deep, //                   #629231
    tintFaint: withAlpha(accent.bright, 0.14), // faint fill for active chips

    space: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 },
    radius: 10,

    /** Soft per-phase tint. */
    phaseTint: {
      inhale: accent.bright,
      holdIn: accent.mid,
      exhale: accent.muted,
      holdOut: accent.mid,
    } as Record<BreathPhaseKind, string>,
  };
}

export type BreathTheme = ReturnType<typeof makeBreathTheme>;

/**
 * Static green tokens, for components not yet converted to the hook. Keeping this
 * export is what makes the migration incremental instead of one big-bang commit:
 * an unconverted file keeps compiling and keeps rendering green.
 */
export const breathTheme = makeBreathTheme(ACCENTS[DEFAULT_ACCENT_ID]);

/** The reactive form. Converted components use this. */
export function useBreathTheme(): BreathTheme {
  const accent = useAccent();
  return useMemo(() => makeBreathTheme(accent), [accent]);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
