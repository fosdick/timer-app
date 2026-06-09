import { View, Text, StyleSheet } from "react-native";
import {
  BreathPattern,
  BreathPhaseKind,
  patternColumns,
  activeColumnIndex,
} from "@/assets/data/breath-patterns";
import { breathTheme as t } from "./breath-theme";

const KIND_SHORT: Record<BreathPhaseKind, string> = {
  inhale: "In",
  holdIn: "Hold",
  exhale: "Out",
  holdOut: "Hold",
};

/**
 * The pattern's phase counts as columns — two for even patterns (Breath / Hold),
 * four for odd (In / Hold / Out / Hold). The current phase column is highlighted
 * while running.
 */
export function PhaseCounts({
  pattern,
  activeKind,
}: {
  pattern: BreathPattern;
  activeKind?: BreathPhaseKind;
}) {
  const { mode, columns } = patternColumns(pattern);
  const activeIdx = activeKind != null ? activeColumnIndex(pattern, activeKind) : -1;
  return (
    <View style={styles.row}>
      {columns.map((c, i) => {
        const active = i === activeIdx;
        const label = mode === "even" ? (i === 0 ? "Breath" : "Hold") : KIND_SHORT[c.kind];
        return (
          <View key={i} style={[styles.col, active && styles.colActive]}>
            <Text style={[styles.label, active && styles.activeText]}>{label}</Text>
            <Text style={[styles.count, active && styles.activeText]}>{c.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: t.space.sm },
  col: {
    alignItems: "center",
    minWidth: 56,
    paddingVertical: t.space.sm,
    paddingHorizontal: t.space.sm,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.line,
  },
  colActive: { borderColor: t.accentSoft, backgroundColor: "rgba(128,222,234,0.10)" },
  label: { color: t.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  count: { color: t.text, fontSize: 22, fontWeight: "400", fontVariant: ["tabular-nums"], marginTop: 2 },
  activeText: { color: t.accentSoft },
});
