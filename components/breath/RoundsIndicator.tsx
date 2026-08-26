import { Text, StyleSheet } from "react-native";
import { breathTheme as t } from "./breath-theme";

/**
 * "Round N of M" under the countdown — text, sized + styled to match the breath
 * count wheel value (24px) but in the lighter green, bold, so it's legible at
 * arm's length. The ⓘ on "Remaining" stays superscript; this is its own line.
 */
export function RoundsIndicator({ current, total }: { current: number; total: number }) {
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

const styles = StyleSheet.create({
  text: {
    color: t.muted, // #7CB342 — lighter green
    fontSize: 24, // matches the breath count wheel value
    fontWeight: "600", // bold
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
    alignSelf: "center", // centered in the screen column (no longer in the header)
    textAlign: "center",
    marginVertical: 8,
  },
});
