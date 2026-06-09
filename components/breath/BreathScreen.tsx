import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { VILOMA, BreathPattern } from "@/assets/data/breath-patterns";
import { useBreathTimer } from "@/assets/utils/use-breath-timer";
import { playSnap } from "@/assets/utils/sounds";
import { PatternPicker } from "./PatternPicker";
import { BreathStage } from "./BreathStage";
import { breathTheme as t } from "./breath-theme";

const DEFAULT_TOTAL_SEC = 300; // 5 min — a duration picker comes in a later pass
const CLICK_SLOT_SEC = 0.3; // the boundary click's own little time container

/**
 * The new breath-pattern timer screen. Assembles the picker + live stage + the
 * tested useBreathTimer. Decoupled and component-based so each piece is reusable
 * and the logic (in breath-timer-core) stays unit-tested.
 */
export default function BreathScreen() {
  const [pattern, setPattern] = useState<BreathPattern>(VILOMA);

  const timer = useBreathTimer(pattern, DEFAULT_TOTAL_SEC, {
    clickSlotSec: CLICK_SLOT_SEC,
    onClick: () => {
      playSnap();
    },
  });

  const choosePattern = (p: BreathPattern) => {
    if (timer.isRunning) return; // lock pattern while running
    timer.reset();
    setPattern(p);
  };

  return (
    <View style={styles.screen}>
      <BreathStage view={timer.view} isRunning={timer.isRunning} />

      <View style={{ flex: 1 }} />

      <View style={styles.controls}>
        <PatternPicker selectedId={pattern.id} onSelect={choosePattern} disabled={timer.isRunning} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.startBtn, timer.isRunning && styles.stopBtn]}
          onPress={() => (timer.isRunning ? timer.stop() : timer.start())}
        >
          <Text style={styles.startText}>{timer.isRunning ? "Stop" : "Start"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg, paddingHorizontal: t.space.lg, paddingBottom: t.space.lg },
  controls: { alignItems: "center", gap: t.space.lg, marginBottom: t.space.md },
  startBtn: {
    backgroundColor: t.accent,
    paddingHorizontal: t.space.xl + 12,
    paddingVertical: t.space.md,
    borderRadius: t.radius,
    minWidth: 200,
    alignItems: "center",
  },
  stopBtn: { backgroundColor: "#5a2a2a" },
  startText: { color: "#FFFFFF", fontSize: 20, fontWeight: "600", letterSpacing: 1 },
});
