import { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { useBreathTheme, type BreathTheme } from "./breath-theme";

/**
 * "Round N of M" under the countdown — text, sized + styled to match the breath
 * count wheel value (24px) but in the lighter accent, bold, so it's legible at
 * arm's length. The ⓘ on "Remaining" stays superscript; this is its own line.
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
      color: t.muted, // accent.mid — #7CB342 in green
      fontSize: 24, // matches the breath count wheel value
      fontWeight: "600", // bold
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
