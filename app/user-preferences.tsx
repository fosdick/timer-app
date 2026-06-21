import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useUserPreferences,
  isDownbeatEnabled,
  COUNT_IN_MIN,
  COUNT_IN_MAX,
} from "@/components/user-preferences-context";
import { colorTheme } from "@/assets/styles/timer-app";

export default function UserPreferencesScreen() {
  const {
    prefs,
    setAutoCorrectExhaleEnd,
    setDownbeatEnabled,
    setCountInEnabled,
    setCountInSec,
  } = useUserPreferences();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <CheckRow
        label="Auto Correct Pranayama total time to end on exhale"
        checked={prefs.autoCorrectExhaleEnd}
        onToggle={() => setAutoCorrectExhaleEnd(!prefs.autoCorrectExhaleEnd)}
      />
      <CheckRow
        label="Enable Pranayama “Begin in” countdown"
        checked={prefs.countInEnabled}
        onToggle={() => setCountInEnabled(!prefs.countInEnabled)}
      />
      <SecondsRow
        label="“Begin in” countdown starts from"
        value={prefs.countInSec}
        onCommit={setCountInSec}
        disabled={!prefs.countInEnabled}
      />
      <CheckRow
        label="Enable metronome snap for Viloma “sips”"
        checked={isDownbeatEnabled(prefs, "viloma")}
        onToggle={() =>
          setDownbeatEnabled("viloma", !isDownbeatEnabled(prefs, "viloma"))
        }
      />
      <CheckRow
        label="Enable metronome snap for Visamavritti"
        checked={isDownbeatEnabled(prefs, "visama")}
        onToggle={() =>
          setDownbeatEnabled("visama", !isDownbeatEnabled(prefs, "visama"))
        }
      />
      <Text style={styles.note}>
        Each pattern also has a Downbeat toggle on its own screen.
      </Text>
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
 * A labeled whole-second input. Keeps its own text buffer so the field can be
 * cleared/edited freely; commits a clamped value to prefs on blur/submit (the
 * context clamps again, so the stored value is always valid).
 */
function SecondsRow({
  label,
  value,
  onCommit,
  disabled,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(String(value));

  // Re-sync the buffer whenever the committed value changes (incl. the clamp).
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) onCommit(n);
    else setText(String(value)); // restore on empty/garbage input
  };

  return (
    <View style={styles.secondsRow}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <View style={styles.secondsField}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={text}
          onChangeText={setText}
          onEndEditing={commit}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={2}
          editable={!disabled}
          selectTextOnFocus
          accessibilityLabel={label}
        />
        <Text style={[styles.suffix, disabled && styles.labelDisabled]}>sec</Text>
      </View>
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
    borderWidth: 2,
    borderColor: colorTheme.borderColor,
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
  note: { color: "#9BA1A6", fontSize: 13, fontStyle: "italic", marginTop: 4 },
  secondsRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  secondsField: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    width: 56,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colorTheme.borderColor,
    color: colorTheme.headerLiteShade,
    fontSize: 17,
    textAlign: "center",
  },
  inputDisabled: { opacity: 0.4 },
  suffix: { color: colorTheme.headerLiteShade, fontSize: 15 },
});
