import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BreathPattern, BREATH_PATTERNS } from "@/assets/data/breath-patterns";
import { breathTheme as t } from "./breath-theme";

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
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: t.space.sm,
  },
  chip: {
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.xs + 2,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.line,
  },
  chipActive: { backgroundColor: t.tintFaint, borderColor: t.border },
  dim: { opacity: 0.5 },
  chipText: { color: t.muted, fontSize: 14 },
  chipTextActive: { color: t.accent, fontWeight: "600" },
});
