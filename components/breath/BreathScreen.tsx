import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  METRONOME,
  BreathPattern,
  EditFieldKey,
  getPattern,
  isMetronome,
  applyCountEdit,
} from "@/assets/data/breath-patterns";
import { useBreathTimer } from "@/assets/utils/use-breath-timer";
import { useAmbience } from "@/assets/utils/use-ambience";
import { getData, storeData } from "@/assets/utils/persistent-storage";
import { getTimeParts } from "@/assets/utils/format-time";
import { PatternPicker } from "./PatternPicker";
import { CountEditors } from "./CountEditors";
import { BreathStage } from "./BreathStage";
import { SoundOptions } from "./SoundOptions";
import { getClickSound, getAmbience, DEFAULT_CLICK_ID, DEFAULT_AMBIENCE_ID } from "./breath-sounds";
import { breathTheme as t } from "./breath-theme";

const BREATH_DATA_KEY = "breath_timer_data";
const DEFAULT_TOTAL_SEC = 300; // 5 min
const CLICK_SLOT_SEC = 0.3; // boundary click's own little time container (patterns only)

type CountSet = { inhale: number; holdIn: number; exhale: number; holdOut: number };

const applyCustom = (base: BreathPattern, custom: Record<string, CountSet>): BreathPattern => {
  const c = custom[base.id];
  return c ? { ...base, ...c } : base;
};
const countsOf = (p: BreathPattern): CountSet => ({
  inhale: p.inhale,
  holdIn: p.holdIn,
  exhale: p.exhale,
  holdOut: p.holdOut,
});

/**
 * The breath-pattern timer (pranayama tab). Holds the selected pattern id + any
 * per-pattern edited counts; derives the live pattern from them. Includes the
 * metronome mode (preserves the original pranayama), editable counts via scroll
 * wheels, a session-length picker, sound options, and persisted settings.
 */
export default function BreathScreen() {
  const [patternId, setPatternId] = useState<string>(METRONOME.id);
  const [customCounts, setCustomCounts] = useState<Record<string, CountSet>>({});
  const [totalSec, setTotalSec] = useState<number>(DEFAULT_TOTAL_SEC);
  const [clickId, setClickId] = useState<string>(DEFAULT_CLICK_ID);
  const [ambienceId, setAmbienceId] = useState<string>(DEFAULT_AMBIENCE_ID);
  const [showPicker, setShowPicker] = useState(false);

  // Memoized so the pattern reference is stable across renders (a new object
  // each render would thrash the timer's memo/effects).
  const pattern = useMemo(
    () => applyCustom(getPattern(patternId) ?? METRONOME, customCounts),
    [patternId, customCounts],
  );
  const metro = isMetronome(pattern);

  // Restore saved settings on mount.
  useEffect(() => {
    (async () => {
      const saved = await getData(BREATH_DATA_KEY);
      if (saved?.breathPatternId && getPattern(saved.breathPatternId)) setPatternId(saved.breathPatternId);
      if (saved?.breathCustomCounts) setCustomCounts(saved.breathCustomCounts);
      if (saved?.breathTotalSec) setTotalSec(saved.breathTotalSec);
      if (saved?.breathClick) setClickId(saved.breathClick);
      if (saved?.breathAmbience) setAmbienceId(saved.breathAmbience);
    })();
  }, []);

  const timer = useBreathTimer(pattern, totalSec, {
    clickSlotSec: metro ? 0 : CLICK_SLOT_SEC,
    onClick: () => getClickSound(clickId).play(),
  });

  useAmbience(getAmbience(ambienceId).asset, timer.isRunning);

  const persist = (over: Partial<Parameters<typeof storeData>[1]>) => {
    storeData(BREATH_DATA_KEY, {
      breathPatternId: patternId,
      breathTotalSec: totalSec,
      breathClick: clickId,
      breathAmbience: ambienceId,
      breathCustomCounts: customCounts,
      ...over,
    });
  };

  const choosePattern = (p: BreathPattern) => {
    if (timer.isRunning) return;
    timer.reset();
    setPatternId(p.id);
    persist({ breathPatternId: p.id });
  };

  const editCount = (key: EditFieldKey, value: number) => {
    if (timer.isRunning) return;
    const next = applyCountEdit(pattern, key, value);
    const nextCustom = { ...customCounts, [patternId]: countsOf(next) };
    setCustomCounts(nextCustom);
    timer.reset();
    persist({ breathCustomCounts: nextCustom });
  };

  return (
    <View style={styles.screen}>
      <BreathStage
        view={timer.view}
        isRunning={timer.isRunning}
        metronome={metro}
        onPressClock={() => setShowPicker(true)}
      />

      <View style={{ flex: 1 }} />

      <View style={styles.controls}>
        <PatternPicker selectedId={pattern.id} onSelect={choosePattern} disabled={timer.isRunning} />

        <CountEditors
          pattern={pattern}
          activeKind={timer.isRunning && !metro ? timer.view.kind : undefined}
          onChange={editCount}
          disabled={timer.isRunning}
        />

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
    borderWidth: 1,
    borderColor: t.border,
    paddingHorizontal: t.space.xl + 12,
    paddingVertical: t.space.md,
    borderRadius: t.radius,
    minWidth: 200,
    alignItems: "center",
  },
  stopBtn: { borderColor: "#C0795A" }, // warmer outline while running
  startText: { color: t.buttonText, fontSize: 20, fontWeight: "600", letterSpacing: 1 },
});
