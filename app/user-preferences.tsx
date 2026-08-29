import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";

import { useUserPreferences } from "@/components/user-preferences-context";
import { colorTheme, timerPickerModalStyles } from "@/assets/styles/timer-app";
import { breathTheme as bt } from "@/components/breath/breath-theme";

export default function UserPreferencesScreen() {
  const { prefs, setUseRounds, setCountInEnabled, setCountInSec } =
    useUserPreferences();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <CheckRow
        label="Use rounds to determine total time"
        checked={prefs.useRounds}
        onToggle={() => setUseRounds(!prefs.useRounds)}
      />
      <CountInRow
        label="Begin in countdown:"
        enabled={prefs.countInEnabled}
        onToggleEnabled={() => setCountInEnabled(!prefs.countInEnabled)}
        value={prefs.countInSec}
        onChange={setCountInSec}
      />
    </ScrollView>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.check}>{"✓"}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

/**
 * One self-contained control: a checkbox to enable/disable the "Begin in"
 * pre-roll, the label, and a tappable counter box that opens a seconds-only
 * scroll wheel — the same idiom as the Pranayama tab's count editors. When the
 * checkbox is unchecked the wheel is muted (greyed + non-tappable). The context
 * clamps the chosen value.
 */
function CountInRow({
  label,
  enabled,
  onToggleEnabled,
  value,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onToggleEnabled: () => void;
  value: number;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const disabled = !enabled;

  return (
    <View style={styles.countInRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel={`Enable ${label}`}
        onPress={onToggleEnabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => pressed && styles.rowPressed}
      >
        <View style={[styles.box, enabled && styles.boxChecked]}>
          {enabled ? <Text style={styles.check}>{"✓"}</Text> : null}
        </View>
      </Pressable>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <TouchableOpacity
        style={[styles.countBox, disabled && styles.countBoxDisabled]}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
        onPress={() => setEditing(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${value} seconds`}
      >
        <Text style={[styles.countValue, disabled && styles.labelDisabled]}>{value}</Text>
        <Text style={[styles.countUnit, disabled && styles.labelDisabled]}>sec</Text>
      </TouchableOpacity>

      <TimerPickerModal
        visible={editing}
        setIsVisible={(v) => {
          if (!v) setEditing(false);
        }}
        initialValue={{ seconds: value }}
        hideHours
        hideMinutes
        modalTitle="Begin in countdown"
        onConfirm={(picked) => {
          onChange(picked.seconds);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        closeOnOverlayPress
        Audio={Audio}
        LinearGradient={LinearGradient}
        styles={timerPickerModalStyles}
        modalProps={{ overlayOpacity: 0.2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colorTheme.backgroundColor },
  content: { padding: 24, gap: 22 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  rowPressed: { opacity: 0.6 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1, // was 2 — the only 2px outlines in the app were the checkboxes
    borderColor: colorTheme.outline,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colorTheme.tabBarActiveTintColor,
    borderColor: colorTheme.tabBarActiveTintColor,
  },
  check: { color: colorTheme.backgroundColor, fontSize: 14, fontWeight: "900", lineHeight: 16 },
  label: { flex: 1, color: colorTheme.headerLiteShade, fontSize: 17, lineHeight: 26 },
  labelDisabled: { opacity: 0.4 },

  // "Begin in countdown:" row — label left, pranayama-style counter box right.
  countInRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  countBox: {
    alignItems: "center",
    minWidth: 64,
    paddingVertical: bt.space.xs,
    paddingHorizontal: bt.space.sm,
    borderRadius: bt.radius,
    borderWidth: 1,
    borderColor: bt.line,
  },
  countBoxDisabled: { opacity: 0.4 },
  countValue: { color: bt.text, fontSize: 24, fontWeight: "400", fontVariant: ["tabular-nums"] },
  countUnit: { color: bt.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
});
