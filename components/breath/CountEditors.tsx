import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  BreathPattern,
  BreathPhaseKind,
  EditFieldKey,
  CountField,
  countFields,
} from "@/assets/data/breath-patterns";
import { breathTheme as t } from "./breath-theme";

/**
 * The single merged count row: each pattern count is one box. Editable counts
 * are tappable (a seconds-only scroll wheel opens, reusing
 * react-native-timer-picker); locked patterns (4-7-8) show display-only boxes.
 * While running, the box for the current phase highlights — the row doubles as
 * the live phase display, so the counts are never shown twice.
 */
export function CountEditors({
  pattern,
  activeKind,
  onChange,
  disabled = false,
}: {
  pattern: BreathPattern;
  /** Current phase while running — highlights its field. */
  activeKind?: BreathPhaseKind;
  onChange: (key: EditFieldKey, value: number) => void;
  disabled?: boolean;
}) {
  const fields = countFields(pattern);
  const [editing, setEditing] = useState<CountField | null>(null);
  if (fields.length === 0) return null;

  return (
    <View style={styles.row}>
      {fields.map((f) => {
        const active = activeKind != null && f.kinds.includes(activeKind);
        return (
          <TouchableOpacity
            key={f.key}
            activeOpacity={0.7}
            disabled={disabled || !f.editable}
            onPress={() => setEditing(f)}
            style={[styles.field, active && styles.fieldActive]}
          >
            <Text style={[styles.label, active && styles.activeText]}>{f.label}</Text>
            <Text style={[styles.value, active && styles.activeText]}>{f.value}</Text>
          </TouchableOpacity>
        );
      })}

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
          if (editing) onChange(editing.key as EditFieldKey, picked.seconds);
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
  fieldActive: { borderColor: t.border, backgroundColor: t.tintFaint },
  label: { color: t.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: t.text, fontSize: 24, fontWeight: "400", fontVariant: ["tabular-nums"] },
  activeText: { color: t.accent },
});
