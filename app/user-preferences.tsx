import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useUserPreferences,
  isDownbeatEnabled,
} from "@/components/user-preferences-context";
import { colorTheme } from "@/assets/styles/timer-app";

export default function UserPreferencesScreen() {
  const { prefs, setAutoCorrectExhaleEnd, setDownbeatEnabled } =
    useUserPreferences();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <CheckRow
        label="Auto Correct Pranayama total time to end on exhale"
        checked={prefs.autoCorrectExhaleEnd}
        onToggle={() => setAutoCorrectExhaleEnd(!prefs.autoCorrectExhaleEnd)}
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
  note: { color: "#9BA1A6", fontSize: 13, fontStyle: "italic", marginTop: 4 },
});
