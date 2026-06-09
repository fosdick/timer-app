import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import { METRONOME, BreathPattern, getPattern, isMetronome } from "@/assets/data/breath-patterns";
import { useBreathTimer } from "@/assets/utils/use-breath-timer";
import { useAmbience } from "@/assets/utils/use-ambience";
import { getData, storeData } from "@/assets/utils/persistent-storage";
import { getTimeParts } from "@/assets/utils/format-time";
import { PatternPicker } from "./PatternPicker";
import { PhaseCounts } from "./PhaseCounts";
import { BreathStage } from "./BreathStage";
import { SoundOptions } from "./SoundOptions";
import {
  getClickSound,
  getAmbience,
  DEFAULT_CLICK_ID,
  DEFAULT_AMBIENCE_ID,
} from "./breath-sounds";
import { breathTheme as t } from "./breath-theme";

const BREATH_DATA_KEY = "breath_timer_data";
const DEFAULT_TOTAL_SEC = 300; // 5 min
const CLICK_SLOT_SEC = 0.3; // the boundary click's own little time container

type BreathSettings = {
  breathPatternId?: string;
  breathTotalSec?: number;
  breathClick?: string;
  breathAmbience?: string;
};

/**
 * The new breath-pattern timer (pranayama tab). Assembles the pattern picker,
 * live stage, phase columns, sound options, a session-length picker, and the
 * tested useBreathTimer — with persisted settings for daily practice.
 */
export default function BreathScreen() {
  const [pattern, setPattern] = useState<BreathPattern>(METRONOME);
  const [totalSec, setTotalSec] = useState<number>(DEFAULT_TOTAL_SEC);
  const [clickId, setClickId] = useState<string>(DEFAULT_CLICK_ID);
  const [ambienceId, setAmbienceId] = useState<string>(DEFAULT_AMBIENCE_ID);
  const [showPicker, setShowPicker] = useState(false);

  // Restore saved settings on mount.
  useEffect(() => {
    (async () => {
      const saved = await getData(BREATH_DATA_KEY);
      const p = saved?.breathPatternId ? getPattern(saved.breathPatternId) : undefined;
      if (p) setPattern(p);
      if (saved?.breathTotalSec) setTotalSec(saved.breathTotalSec);
      if (saved?.breathClick) setClickId(saved.breathClick);
      if (saved?.breathAmbience) setAmbienceId(saved.breathAmbience);
    })();
  }, []);

  const metro = isMetronome(pattern);

  const timer = useBreathTimer(pattern, totalSec, {
    clickSlotSec: metro ? 0 : CLICK_SLOT_SEC, // metronome: pure interval, click exactly every N sec
    onClick: () => getClickSound(clickId).play(),
  });

  // Calming bed loops while the timer runs (None => silent).
  useAmbience(getAmbience(ambienceId).asset, timer.isRunning);

  // Persist; `over` carries the freshly-changed value (state is stale in closure).
  const persist = (over: BreathSettings) => {
    storeData(BREATH_DATA_KEY, {
      breathPatternId: pattern.id,
      breathTotalSec: totalSec,
      breathClick: clickId,
      breathAmbience: ambienceId,
      ...over,
    });
  };

  const choosePattern = (p: BreathPattern) => {
    if (timer.isRunning) return;
    timer.reset();
    setPattern(p);
    persist({ breathPatternId: p.id });
  };

  return (
    <View style={styles.screen}>
      <BreathStage
        view={timer.view}
        isRunning={timer.isRunning}
        metronome={metro}
        onPressClock={() => setShowPicker(true)}
      />

      {!metro && (
        <PhaseCounts pattern={pattern} activeKind={timer.isRunning ? timer.view.kind : undefined} />
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.controls}>
        <PatternPicker selectedId={pattern.id} onSelect={choosePattern} disabled={timer.isRunning} />

        <SoundOptions
          clickId={clickId}
          ambienceId={ambienceId}
          onClickChange={(id) => {
            setClickId(id);
            persist({ breathClick: id });
          }}
          onAmbienceChange={(id) => {
            setAmbienceId(id);
            persist({ breathAmbience: id });
          }}
          disabled={timer.isRunning}
        />

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
  controls: { alignItems: "center", gap: t.space.md, marginBottom: t.space.md },
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
