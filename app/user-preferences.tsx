import { useMemo, useState } from "react";
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

import { useUserPreferences, useAccent, useAppColors } from "@/components/user-preferences-context";
import { ACCENTS, ACCENT_LABELS, type AccentId } from "@/assets/theme/accent";
import { timerPickerModalStyles, type AppColorTheme } from "@/assets/styles/timer-app";
import { useBreathTheme, type BreathTheme } from "@/components/breath/breath-theme";

export default function UserPreferencesScreen() {
  const c = useAppColors();
  const bt = useBreathTheme();
  const styles = useMemo(() => makeStyles(c, bt), [c, bt]);
  const { prefs, setUseRounds, setCountInEnabled, setCountInSec, setAccentId } =
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
      <AccentRow selected={prefs.accentId} onSelect={setAccentId} />
    </ScrollView>
  );
}

/**
 * Colour accent picker. A list, not a colour wheel — accents are curated so every
 * one is guaranteed to keep contrast on the fixed ground. Adding a theme adds a row
 * here automatically; it reads straight from ACCENTS.
 */
function AccentRow({
  selected,
  onSelect,
}: {
  selected: AccentId;
  onSelect: (id: AccentId) => void;
}) {
  const c = useAppColors();
  const bt = useBreathTheme();
  const styles = useMemo(() => makeStyles(c, bt), [c, bt]);
  const accent = useAccent();
  const ids = Object.keys(ACCENTS) as AccentId[];
  return (
    <View style={styles.accentBlock}>
      <Text style={[styles.accentTitle, { color: accent.muted }]}>Colour</Text>
      <View style={styles.accentRow}>
        {ids.map((id) => {
          const a = ACCENTS[id];
          const on = id === selected;
          return (
            <TouchableOpacity
              key={id}
              testID={`accent-${id}`}
              activeOpacity={0.7}
              onPress={() => onSelect(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${ACCENT_LABELS[id]} colour theme`}
              style={[
                styles.accentChip,
                { borderColor: on ? accent.muted : a.trackOff },
              ]}
            >
              {/* The swatch is the accent judging itself — bright over mid over
                  muted, the three roles a user actually sees most. */}
              <View style={styles.swatch}>
                <View style={[styles.swatchBar, { backgroundColor: a.bright }]} />
                <View style={[styles.swatchBar, { backgroundColor: a.mid }]} />
                <View style={[styles.swatchBar, { backgroundColor: a.muted }]} />
              </View>
              <Text
                style={[
                  styles.accentLabel,
                  { color: on ? accent.bright : accent.muted, fontWeight: on ? "600" : "400" },
                ]}
              >
                {ACCENT_LABELS[id]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  const c = useAppColors();
  const bt = useBreathTheme();
  const styles = useMemo(() => makeStyles(c, bt), [c, bt]);
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
  const c = useAppColors();
  const bt = useBreathTheme();
  const styles = useMemo(() => makeStyles(c, bt), [c, bt]);
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

const makeStyles = (c: AppColorTheme, bt: BreathTheme) =>
  StyleSheet.create({
  accentBlock: { marginTop: 28, paddingHorizontal: 20 },
  accentTitle: {
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  accentRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  accentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  swatch: { flexDirection: "row", gap: 2 },
  swatchBar: { width: 8, height: 18, borderRadius: 2 },
  accentLabel: { fontSize: 16 },
  screen: { flex: 1, backgroundColor: c.backgroundColor },
  content: { padding: 24, gap: 22 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  rowPressed: { opacity: 0.6 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1, // was 2 — the only 2px outlines in the app were the checkboxes
    borderColor: c.outline,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: c.tabBarActiveTintColor,
    borderColor: c.tabBarActiveTintColor,
  },
  check: { color: c.backgroundColor, fontSize: 14, fontWeight: "900", lineHeight: 16 },
  label: { flex: 1, color: c.headerLiteShade, fontSize: 17, lineHeight: 26 },
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
  countValue: { color: bt.muted, fontSize: 24, fontWeight: "400", fontVariant: ["tabular-nums"] },
  countUnit: { color: bt.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
});
