import { useAppStyles } from "@/components/user-preferences-context";
import { useState, useMemo } from "react";
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
import { useBreathTheme, type BreathTheme } from "./breath-theme";


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
  const { picker: timerPickerModalStyles } = useAppStyles();
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
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
        styles={timerPickerModalStyles}
        modalProps={{ overlayOpacity: 0.2 }}
      />
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: t.space.sm, flexWrap: "wrap" },
  // A FIELD, not a box. BREATH/10 and CLICK/Snap were the same bordered container,
  // so an editable number and a picker read as the same kind of control. An
  // underline is the shape of something you type into.
  field: {
    alignItems: "center",
    // Fixed, equal width so the three underlines form ONE ruled line across the row.
    // With minWidth the rule hugged its label, so "BREATH" drew a short rule next to
    // "RETENTION OUT"'s long one and the row read as ragged rather than as a set.
    width: 104,
    paddingHorizontal: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderColor: t.line,
  },
  // Same toning as the pattern chips: identical idiom (t.line base, bright border
  // + faint tint when active), so the two selected states must not diverge.
  fieldActive: { borderColor: t.label },
  label: { color: t.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: t.muted, fontSize: 24, fontWeight: "400", fontVariant: ["tabular-nums"] },
  activeText: { color: t.accent },
});
