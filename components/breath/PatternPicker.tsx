import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BreathPattern, BREATH_PATTERNS } from "@/assets/data/breath-patterns";
import { useBreathTheme, type BreathTheme } from "./breath-theme";

/** Row of selectable pattern chips (Box / Nadi Shodhana / Viloma / 4-7-8). */
export function PatternPicker({
  patterns = BREATH_PATTERNS,
  selectedId,
  onSelect,
  disabled = false,
}: {
  patterns?: BreathPattern[];
  selectedId: string;
  onSelect: (pattern: BreathPattern) => void;
  disabled?: boolean;
}) {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.row}>
      {patterns.map((p) => {
        const active = p.id === selectedId;
        return (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={() => onSelect(p)}
            style={[styles.chip, active && styles.chipActive, disabled && !active && styles.dim]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[styles.chipText, active && styles.chipTextActive]}
            >
              {p.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  // EVEN GRID, three across. Chips previously sized themselves to their text, so
  // "Nadi Shodhana" was a slab and "Box" a nub — visual weight encoded spelling
  // rather than importance, and the set read as scattered shapes instead of one
  // control. Fixed cells make selection the only thing that differs.
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: t.space.sm,
  },
  chip: {
    flexBasis: "30%",
    paddingHorizontal: 4,
    paddingVertical: t.space.xs + 3,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.line,
    alignItems: "center",
    justifyContent: "center",
  },
  // Selected: same 1px thickness as unselected (that reads right already) — only
  // the colour is toned. Was t.border, accent.BORDER #91BD27, the brightest value
  // in the ramp, which made selection shout. t.label is accent.muted, still clearly
  // stronger than the unselected translucent line but no longer the loudest thing
  // on screen. Bold text stays as the primary selection signal.
  chipActive: { backgroundColor: t.tintFaint, borderColor: t.label },
  dim: { opacity: 0.5 },
  chipText: { color: t.muted, fontSize: 14, textAlign: "center" },
  chipTextActive: { color: t.accent, fontWeight: "600" },
});
