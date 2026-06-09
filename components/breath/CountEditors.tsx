import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import { BreathPattern, EditFieldKey, EditField, editableFields } from "@/assets/data/breath-patterns";
import { breathTheme as t } from "./breath-theme";

/**
 * Compact, tappable count values. Tapping one opens a seconds-only scroll wheel
 * (reusing react-native-timer-picker) to edit it — space-saving, familiar
 * date-picker-style scroll select. Locked patterns (4-7-8) render nothing.
 */
export function CountEditors({
  pattern,
  onChange,
  disabled = false,
}: {
  pattern: BreathPattern;
  onChange: (key: EditFieldKey, value: number) => void;
  disabled?: boolean;
}) {
  const fields = editableFields(pattern);
  const [editing, setEditing] = useState<EditField | null>(null);
  if (fields.length === 0) return null;

  return (
    <View style={styles.row}>
      {fields.map((f) => (
        <TouchableOpacity
          key={f.key}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => setEditing(f)}
          style={[styles.field, disabled && styles.dim]}
        >
          <Text style={styles.label}>{f.label}</Text>
          <Text style={styles.value}>{f.value}</Text>
        </TouchableOpacity>
      ))}

      <TimerPickerModal
        visible={editing != null}
        setIsVisible={(v) => {
          if (!v) setEditing(null);
        }}
        initialValue={{ seconds: editing?.value ?? 0 }}
        hideHours
        hideMinutes
        modalTitle={editing ? `${editing.label} (count)` : ""}
        onConfirm={(picked) => {
          if (editing) onChange(editing.key, picked.seconds);
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
        closeOnOverlayPress
        Audio={Audio}
        LinearGradient={LinearGradient}
        styles={{ theme: "dark" }}
        modalProps={{ overlayOpacity: 0.2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: t.space.sm, flexWrap: "wrap" },
  field: {
    alignItems: "center",
    minWidth: 64,
    paddingVertical: t.space.xs,
    paddingHorizontal: t.space.sm,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.line,
  },
  dim: { opacity: 0.5 },
  label: { color: t.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: t.text, fontSize: 24, fontWeight: "400", fontVariant: ["tabular-nums"] },
});
