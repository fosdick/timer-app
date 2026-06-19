import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BreathView } from "@/assets/data/breath-timer-core";
import { yogaTypography } from "@/assets/theme";
import { breathTheme as t, formatClock } from "./breath-theme";

/**
 * The central live display: total time remaining up top (label + countdown
 * typography shared with the yoga tab so the tabs read as one app; tapping the
 * number still opens the session-length picker), and — while running — the
 * current phase label plus the count remaining in that phase (a single
 * glanceable number; the calm comes from the boundary click, not per-count
 * ticks). The center area is FIXED height so the controls below never shift
 * when the session starts.
 */
export function BreathStage({
  view,
  isRunning,
  metronome = false,
  onPressClock,
  countIn = null,
}: {
  view: BreathView;
  isRunning: boolean;
  metronome?: boolean;
  onPressClock?: () => void;
  /** Seconds left in the pre-roll count-in ("Begin in N"), or null when not counting in. */
  countIn?: number | null;
}) {
  const tint = metronome ? t.accentSoft : t.phaseTint[view.kind] ?? t.accentSoft;
  const counting = countIn !== null;
  const showCount = isRunning && view.segmentType === "breath" && view.countRemaining > 0;
  // The clock (session-length picker) is locked once a sequence is committed —
  // running OR counting in.
  const clockDisabled = isRunning || counting || !onPressClock;
  return (
    <View style={styles.stage}>
      <Text style={yogaTypography.timerLabel}>Remaining</Text>
      <TouchableOpacity activeOpacity={0.7} disabled={clockDisabled} onPress={onPressClock}>
        <Text style={yogaTypography.timerCountdown}>{formatClock(view.totalRemaining)}</Text>
      </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", marginTop: 10 }, // mirrors the yoga tab's timer block offset
  center: { alignItems: "center", justifyContent: "center", height: 150 }, // fixed: no layout shift on start
  phase: { fontSize: 24, fontWeight: "300", letterSpacing: 2 },
  count: { fontSize: 88, fontWeight: "200", fontVariant: ["tabular-nums"] },
  idle: { color: t.muted, fontSize: 22, fontWeight: "300", letterSpacing: 2 },
});
