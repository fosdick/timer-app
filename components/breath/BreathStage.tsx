import { View, Text, StyleSheet } from "react-native";
import { BreathView } from "@/assets/data/breath-timer-core";
import { breathTheme as t, formatClock } from "./breath-theme";

/**
 * The central live display: total time remaining up top, and — while running —
 * the current phase label plus the count remaining in that phase (a single
 * glanceable number; the calm comes from the boundary click, not per-count ticks).
 */
export function BreathStage({ view, isRunning }: { view: BreathView; isRunning: boolean }) {
  const tint = t.phaseTint[view.kind] ?? t.accentSoft;
  const showCount = isRunning && view.segmentType === "breath" && view.countRemaining > 0;
  return (
    <View style={styles.stage}>
      <Text style={styles.clockLabel}>remaining</Text>
      <Text style={styles.clock}>{formatClock(view.totalRemaining)}</Text>

      <View style={styles.center}>
        {isRunning ? (
          <>
            <Text style={[styles.phase, { color: tint }]}>{view.label}</Text>
            <Text style={[styles.count, { color: tint }]}>{showCount ? view.countRemaining : " "}</Text>
          </>
        ) : (
          <Text style={styles.idle}>Breathe</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", paddingTop: t.space.xl },
  clockLabel: { color: t.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  clock: { color: t.text, fontSize: 44, fontWeight: "200", fontVariant: ["tabular-nums"] },
  center: { alignItems: "center", justifyContent: "center", minHeight: 200 },
  phase: { fontSize: 26, fontWeight: "300", letterSpacing: 2 },
  count: { fontSize: 96, fontWeight: "200", fontVariant: ["tabular-nums"], marginTop: t.space.sm },
  idle: { color: t.muted, fontSize: 22, fontWeight: "300", letterSpacing: 2 },
});
