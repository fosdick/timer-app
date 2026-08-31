import { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { useBreathTheme, type BreathTheme } from "./breath-theme";

/**
 * "Round N of M" under the countdown — sized to match the breath count wheel value
 * (24px). The ⓘ on "Remaining" stays superscript; this is its own line.
 *
 * Toned 2026-08-28 at the user's call: was weight 600 in accent.mid, which made the
 * least important number on the screen the heaviest thing on it (the countdown
 * beside it is 300). Now 300 in accent.muted. The previous note argued 600 was
 * "bold, so it's legible at arm's length" — that trade was put to the user, who
 * practises with this daily, and he chose the quieter option knowingly.
 *
 * REFERENCE IMPLEMENTATION for accent theming. The pattern, applied file by file:
 *
 *   1. a `makeStyles(t: BreathTheme)` factory instead of a module-level
 *      StyleSheet.create — a module-level one resolves ONCE at import, which is
 *      exactly why the old BlueTheme switch could never take effect at runtime;
 *   2. read the theme with the hook;
 *   3. memoise on the theme so styles are rebuilt only when the accent changes,
 *      not on every render.
 *
 * Layout values stay in the factory too. Splitting colour out into inline styles
 * would technically work but leaves two places to look for one component's styling.
 */
const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
    text: {
      // NOTE: breathTheme.muted is accent.MID; the dimmer role is breathTheme.label.
      color: t.label, // accent.muted — #689F38 in green
      fontSize: 24, // matches the breath count wheel value
      fontWeight: "300",
      letterSpacing: 0.5,
      fontVariant: ["tabular-nums"],
      alignSelf: "center", // centered in the screen column (no longer in the header)
      textAlign: "center",
      marginVertical: 8,
    },
  });

export function RoundsIndicator({ current, total }: { current: number; total: number }) {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  if (total <= 0) return null;
  return (
    <Text
      style={styles.text}
      accessibilityRole="text"
      accessibilityLabel={`Round ${current} of ${total}`}
    >
      {`Round ${current} of ${total}`}
    </Text>
  );
}
