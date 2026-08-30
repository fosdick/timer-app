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

import {
  useUserPreferences,
  useAccent,
  useAppColors,
  useAppStyles,
} from "@/components/user-preferences-context";
import { ACCENTS, ACCENT_LABELS, type AccentId } from "@/assets/theme/accent";
import { UserSvg, PRONOUNS, PRONOUN_LABELS, type Pronoun } from "@/assets/images/svgx/user";
import { type AppColorTheme } from "@/assets/styles/timer-app";
import { useBreathTheme, type BreathTheme } from "@/components/breath/breath-theme";

export default function UserPreferencesScreen() {
  const c = useAppColors();
  const bt = useBreathTheme();
  const styles = useMemo(() => makeStyles(c, bt), [c, bt]);
  const { prefs, setUseRounds, setCountInEnabled, setCountInSec, setAccentId, setPronoun } =
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
      <PronounRow selected={prefs.pronoun} onSelect={setPronoun} />
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
              // Coloured by the chip's OWN accent, never the active one. Before
              // this, "Blue" rendered in green whenever green was selected — the
              // label contradicted the swatch sitting next to it.
              style={[
                styles.accentChip,
                { borderColor: on ? a.muted : a.trackOff },
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
                  { color: on ? a.bright : a.muted, fontWeight: on ? "600" : "400" },
                ]}
                // "Golden Sun" is the longest label and overflowed its third of
                // the row — it rendered clipped at the chip's edge. Shrink to fit
                // rather than widen the chip, so the grid stays even.
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
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

/**
 * Pronoun picker. Sets the glyph shown in the header.
 *
 * The icon colour is fixed per pronoun and deliberately does NOT follow the accent:
 * it is the one mark on screen that says something about the person rather than
 * about the app, so it should stay put when they recolour everything else. Each
 * button previews the exact glyph and tone it will produce.
 */
function PronounRow({
  selected,
  onSelect,
}: {
  selected: Pronoun;
  onSelect: (p: Pronoun) => void;
}) {
  const accent = useAccent();
  const c = useAppColors();
  const bt = useBreathTheme();
  const styles = useMemo(() => makeStyles(c, bt), [c, bt]);
  return (
    <View style={styles.accentBlock}>
      <Text style={[styles.accentTitle, { color: accent.muted }]}>Pronoun</Text>
      <View style={styles.accentRow}>
        {PRONOUNS.map((p) => {
          const on = p === selected;
          return (
            <TouchableOpacity
              key={p}
              testID={`pronoun-${p}`}
              activeOpacity={0.7}
              onPress={() => onSelect(p)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Use the ${PRONOUN_LABELS[p]} icon`}
              style={[
                styles.pronounChip,
                { borderColor: on ? accent.muted : accent.trackOff },
              ]}
            >
              {/* The swatch IS the glyph, at the tone it will actually render. */}
              <View style={styles.pronounGlyph}>
                <UserSvg pronoun={p} width={26} height={26} />
              </View>
              <Text
                style={[
                  styles.accentLabel,
                  { color: on ? accent.bright : accent.muted, fontWeight: on ? "600" : "400" },
                ]}
              >
                {PRONOUN_LABELS[p]}
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
  // From the hook, NOT the static sheet. This screen is where the accent is
  // chosen, and it was the last call site in the app still importing the
  // module-level green sheet — so picking blue left this one picker green.
  const { picker: timerPickerModalStyles } = useAppStyles();
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
  // Even 3-across grid. With two themes a plain wrapping row was fine; at five
  // it went ragged, each chip sized to its own label. Same fix as the pattern
  // chips on the breath tab: give every chip the same basis so the rows line up.
  accentRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  accentChip: {
    flexBasis: "30%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  pronounChip: {
    flexBasis: "30%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  // Pale disc behind the glyph, mirroring the header's grey circle so the preview
  // shows the icon in the context it will actually appear in.
  pronounGlyph: {
    width: 30,
    height: 30,
    borderRadius: 15,
    // The header's own colour, because that is where this glyph actually lives —
    // so the chip previews the real thing. It was a hardcoded #B9C2BE grey, which
    // was the same undesigned-grey problem as the header pill, just self-inflicted.
    backgroundColor: c.headerLiteShade,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: { flexDirection: "row", gap: 2 },
  swatchBar: { width: 6, height: 18, borderRadius: 2 },
  // flexShrink is what makes adjustsFontSizeToFit work: without it the Text has
  // no width to shrink INTO, so it just overflowed and the chip border clipped
  // "Golden Sun" mid-word. The prop alone was not enough.
  accentLabel: { fontSize: 15, flexShrink: 1 },
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
