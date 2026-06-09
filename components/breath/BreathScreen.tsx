import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import { VILOMA, BreathPattern, getPattern } from "@/assets/data/breath-patterns";
import { useBreathTimer } from "@/assets/utils/use-breath-timer";
import { playSnap } from "@/assets/utils/sounds";
import { getData, storeData } from "@/assets/utils/persistent-storage";
import { getTimeParts } from "@/assets/utils/format-time";
import { PatternPicker } from "./PatternPicker";
import { PhaseCounts } from "./PhaseCounts";
import { BreathStage } from "./BreathStage";
import { breathTheme as t } from "./breath-theme";

const BREATH_DATA_KEY = "breath_timer_data";
const DEFAULT_TOTAL_SEC = 300; // 5 min
const CLICK_SLOT_SEC = 0.3; // the boundary click's own little time container

/**
 * The new breath-pattern timer screen. Assembles the picker + live stage + the
 * tested useBreathTimer, with a session-length picker and persisted settings.
 */
export default function BreathScreen() {
  const [pattern, setPattern] = useState<BreathPattern>(VILOMA);
  const [totalSec, setTotalSec] = useState<number>(DEFAULT_TOTAL_SEC);
  const [showPicker, setShowPicker] = useState(false);

  // Restore saved pattern + session length on mount.
  useEffect(() => {
    (async () => {
      const saved = await getData(BREATH_DATA_KEY);
      const p = saved?.breathPatternId ? getPattern(saved.breathPatternId) : undefined;
      if (p) setPattern(p);
      if (saved?.breathTotalSec) setTotalSec(saved.breathTotalSec);
    })();
  }, []);

  const timer = useBreathTimer(pattern, totalSec, {
    clickSlotSec: CLICK_SLOT_SEC,
    onClick: () => {
      playSnap();
    },
  });

  // Persist current settings; `over` explicitly carries the changed value so we
  // don't depend on a freshly-set state value (which is still stale in closure).
  const persist = (over: { breathPatternId?: string; breathTotalSec?: number }) => {
    storeData(BREATH_DATA_KEY, {
      breathPatternId: pattern.id,
      breathTotalSec: totalSec,
      ...over,
    });
  };

  const choosePattern = (p: BreathPattern) => {
    if (timer.isRunning) return; // lock pattern while running
    timer.reset();
    setPattern(p);
    persist({ breathPatternId: p.id });
  };

  return (
    <View style={styles.screen}>
      <BreathStage
        view={timer.view}
        isRunning={timer.isRunning}
        onPressClock={() => setShowPicker(true)}
      />

      <PhaseCounts pattern={pattern} activeKind={timer.isRunning ? timer.view.kind : undefined} />

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

      <TimerPickerModal
        visible={showPicker}
        setIsVisible={setShowPicker}
        initialValue={getTimeParts(totalSec)}
        hideHours
        onConfirm={(picked) => {
          const newTotal = picked.hours * 3600 + picked.minutes * 60 + picked.seconds;
          setTotalSec(newTotal);
          setShowPicker(false);
          timer.reset();
          persist({ breathTotalSec: newTotal });
        }}
        modalTitle="Session length"
        onCancel={() => setShowPicker(false)}
        closeOnOverlayPress
        Audio={Audio}
        LinearGradient={LinearGradient}
        styles={{ theme: "dark" }}
        modalProps={{ overlayOpacity: 0.2 }}
      />
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
