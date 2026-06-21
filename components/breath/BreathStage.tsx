import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BreathView } from "@/assets/data/breath-timer-core";
import { yogaTypography } from "@/assets/theme";
import { breathTheme as t, formatClock } from "./breath-theme";

/**
 * The live display, split so the counts slide-up can cover the CENTER while the
 * header (total time remaining) stays fixed and always visible:
 *   - BreathStageHeader: "Remaining" label (+ ⓘ) and the countdown — tapping the
 *     number opens the session-length picker. Shared typography with the yoga tab.
 *   - BreathStageCenter: while running, the phase label + glanceable count (or
 *     "Begin in N" during the count-in; idle text otherwise).
 */
export function BreathStageHeader({
  view,
  isRunning,
  onPressClock,
  countIn = null,
  endsOnExhale = false,
  onInfoPress,
}: {
  view: BreathView;
  isRunning: boolean;
  onPressClock?: () => void;
  countIn?: number | null;
  endsOnExhale?: boolean;
  onInfoPress?: () => void;
}) {
  const counting = countIn !== null;
  // The clock (session-length picker) is locked once a sequence is committed —
  // running OR counting in.
  const clockDisabled = isRunning || counting || !onPressClock;
  return (
    <View style={styles.header}>
      <View style={styles.labelRow}>
        <Text style={yogaTypography.timerLabel}>Remaining</Text>
        {endsOnExhale && onInfoPress ? (
          <TouchableOpacity
            onPress={onInfoPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="About session length"
          >
            <Text style={styles.info}>{"ⓘ"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity activeOpacity={0.7} disabled={clockDisabled} onPress={onPressClock}>
        <Text style={yogaTypography.timerCountdown}>{formatClock(view.totalRemaining)}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function BreathStageCenter({
  view,
  isRunning,
  metronome = false,
  countIn = null,
}: {
  view: BreathView;
  isRunning: boolean;
  metronome?: boolean;
  countIn?: number | null;
}) {
  const tint = metronome ? t.accentSoft : t.phaseTint[view.kind] ?? t.accentSoft;
  const counting = countIn !== null;
  const showCount = isRunning && view.segmentType === "breath" && view.countRemaining > 0;
  return (
    <View style={styles.center}>
      {counting ? (
        <>
          <Text style={[styles.phase, { color: t.accentSoft }]}>Begin in</Text>
          <Text style={[styles.count, { color: t.accentSoft }]}>{countIn}</Text>
        </>
      ) : isRunning ? (
        <>
          {!metronome && <Text style={[styles.phase, { color: tint }]}>{view.label}</Text>}
          <Text style={[styles.count, { color: tint }]}>{showCount ? view.countRemaining : " "}</Text>
        </>
      ) : (
        <Text style={styles.idle}>{metronome ? "Metronome" : "Breathe"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginTop: 10 }, // mirrors the yoga tab's timer block offset
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  info: { color: t.muted, fontSize: 15 },
  center: { alignItems: "center", justifyContent: "center", height: 150 },
  phase: { fontSize: 24, fontWeight: "300", letterSpacing: 2 },
  count: { fontSize: 88, fontWeight: "200", fontVariant: ["tabular-nums"] },
  idle: { color: t.muted, fontSize: 22, fontWeight: "300", letterSpacing: 2 },
});
