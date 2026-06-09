import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CLICK_SOUNDS, AMBIENCES } from "./breath-sounds";
import { breathTheme as t } from "./breath-theme";

interface Option {
  id: string;
  label: string;
}

function ChipRow({
  label,
  options,
  selectedId,
  onSelect,
  disabled,
}: {
  label: string;
  options: Option[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const active = o.id === selectedId;
          return (
            <TouchableOpacity
              key={o.id}
              activeOpacity={0.7}
              disabled={disabled}
              onPress={() => onSelect(o.id)}
              style={[styles.chip, active && styles.chipActive, disabled && !active && styles.dim]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Click-sound and ambience selectors for the breath timer. */
export function SoundOptions({
  clickId,
  ambienceId,
  onClickChange,
  onAmbienceChange,
  disabled,
}: {
  clickId: string;
  ambienceId: string;
  onClickChange: (id: string) => void;
  onAmbienceChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <ChipRow label="Click" options={CLICK_SOUNDS} selectedId={clickId} onSelect={onClickChange} disabled={disabled} />
      <ChipRow label="Ambience" options={AMBIENCES} selectedId={ambienceId} onSelect={onAmbienceChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: t.space.sm, alignItems: "center" },
  group: { alignItems: "center", gap: t.space.xs },
  groupLabel: { color: t.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: t.space.xs + 2 },
  chip: {
    paddingHorizontal: t.space.sm + 2,
    paddingVertical: t.space.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.line,
  },
  chipActive: { backgroundColor: t.tintFaint, borderColor: t.border },
  dim: { opacity: 0.5 },
  chipText: { color: t.muted, fontSize: 12 },
  chipTextActive: { color: t.accent, fontWeight: "600" },
});
