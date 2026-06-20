import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, type Href } from "expo-router";
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
  adjustTotalToExhaleEnd,
} from "@/assets/data/breath-patterns";
import { useBreathTimer } from "@/assets/utils/use-breath-timer";
import { useAmbience } from "@/assets/utils/use-ambience";
import { useReportActiveTimer } from "@/components/active-timer-context";
import { useUserPreferences, isDownbeatEnabled } from "@/components/user-preferences-context";
import { getData, storeData } from "@/assets/utils/persistent-storage";
import { getTimeParts } from "@/assets/utils/format-time";
import { playStart, playEndChime } from "@/assets/utils/sounds";
import { screenStyles } from "@/assets/styles/timer-app";
import { PatternPicker } from "./PatternPicker";
import { CountEditors } from "./CountEditors";
import { BreathStage } from "./BreathStage";
import { SoundOptions } from "./SoundOptions";
import { getClickSound, getAmbience, DEFAULT_CLICK_ID, DEFAULT_DOWNBEAT_ID, DEFAULT_AMBIENCE_ID } from "./breath-sounds";
import { breathTheme as t, formatClock } from "./breath-theme";

const BREATH_DATA_KEY = "breath_timer_data";
const DEFAULT_TOTAL_SEC = 300; // 5 min
const CLICK_SLOT_SEC = 0.3; // boundary click's own little time container (patterns only)
const COUNT_IN_SEC = 8; // "Begin in" pre-roll before a fresh sequence starts

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
  const [downbeatId, setDownbeatId] = useState<string>(DEFAULT_DOWNBEAT_ID);
  const [ambienceId, setAmbienceId] = useState<string>(DEFAULT_AMBIENCE_ID);
  const [showPicker, setShowPicker] = useState(false);
  // Live raw value the length picker is scrolled to — drives the "ends on
  // exhale · m:ss" preview in the modal title.
  const [pickerSec, setPickerSec] = useState<number>(DEFAULT_TOTAL_SEC);
  const router = useRouter();

  // Memoized so the pattern reference is stable across renders (a new object
  // each render would thrash the timer's memo/effects).
  const pattern = useMemo(
    () => applyCustom(getPattern(patternId) ?? METRONOME, customCounts),
    [patternId, customCounts],
  );
  const metro = isMetronome(pattern);

  const { prefs, setDownbeatEnabled } = useUserPreferences();
  // Per-pattern downbeat snap (a pulse on each count during inhale/exhale).
  // Metronome has no breath phases, so it never gets downbeats.
  const patternDownbeatOn = isDownbeatEnabled(prefs, patternId);
  const downbeatActive = patternDownbeatOn && !metro;
  // The session ends on an exhale (when the user pref is on): round the chosen
  // length UP to the end of an exhale phase (whole rounds for Nadi). `totalSec`
  // stays the user's raw pick; this derived value is what the timer runs and the
  // UI shows. Metronome is unaffected (no exhale to land on). Must use the SAME
  // timeline opts as the timer below so the end bell lands exactly on the exhale.
  const endsOnExhale = prefs.autoCorrectExhaleEnd && !metro;
  const effectiveTotalSec = useMemo(
    () =>
      prefs.autoCorrectExhaleEnd
        ? adjustTotalToExhaleEnd(pattern, totalSec, {
            clickSlotSec: metro ? 0 : CLICK_SLOT_SEC,
            countDurationSec: 1,
          })
        : totalSec,
    [pattern, totalSec, metro, prefs.autoCorrectExhaleEnd],
  );

  // Live "ends on exhale · m:ss" preview shown in the length picker's title as
  // the user scrolls (pickerSec), so the round-up is never a surprise — matters
  // most for Nadi's coarse, whole-round steps.
  const pickerTitle = endsOnExhale
    ? `Ends on exhale · ${formatClock(
        Math.round(
          adjustTotalToExhaleEnd(pattern, pickerSec, {
            clickSlotSec: CLICK_SLOT_SEC,
            countDurationSec: 1,
          }),
        ),
      )}`
    : "Session length";

  const showExhaleInfo = () =>
    Alert.alert(
      "Ends on exhale",
      "Pranayama sessions round up so you finish on an exhale. You can turn this off in User Preferences.",
      [
        { text: "Open Preferences", onPress: () => router.push("/user-preferences" as Href) },
        { text: "OK", style: "cancel" },
      ],
    );

  // Restore saved settings on mount.
  useEffect(() => {
    (async () => {
      const saved = await getData(BREATH_DATA_KEY);
      if (saved?.breathPatternId && getPattern(saved.breathPatternId)) setPatternId(saved.breathPatternId);
      if (saved?.breathCustomCounts) setCustomCounts(saved.breathCustomCounts);
      if (saved?.breathTotalSec) setTotalSec(saved.breathTotalSec);
      if (saved?.breathClick) setClickId(saved.breathClick);
      if (saved?.breathDownbeat) setDownbeatId(saved.breathDownbeat);
      if (saved?.breathAmbience) setAmbienceId(saved.breathAmbience);
    })();
  }, []);

  // Start/end chimes match the yoga tab (canonical behavior — see the old
  // pranayama component): bell-hit on Start, end-bell when the session ends.
  const timer = useBreathTimer(pattern, effectiveTotalSec, {
    clickSlotSec: metro ? 0 : CLICK_SLOT_SEC,
    onClick: () => getClickSound(clickId).play(),
    onFinish: () => playEndChime(),
    // Downbeat snap on each count during inhale/exhale, when enabled for this
    // pattern. undefined disables the per-count work entirely in the hook.
    onDownbeat: downbeatActive ? () => getClickSound(downbeatId).play() : undefined,
  });

  useAmbience(getAmbience(ambienceId).asset, timer.isRunning);

  // Count-in ("Begin in N"): a pre-roll before a FRESH sequence so the user can
  // settle / place their hands (esp. Nadi Shodhana) before the practice starts.
  // null = not counting in. It does NOT run on resume — only a fresh start.
  const [countIn, setCountIn] = useState<number | null>(null);
  const countInRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = timer.isRunning || countIn !== null;

  const stopCountIn = () => {
    if (countInRef.current) {
      clearInterval(countInRef.current);
      countInRef.current = null;
    }
    setCountIn(null);
  };

  const beginCountIn = () => {
    let remaining = COUNT_IN_SEC;
    setCountIn(remaining);
    countInRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        stopCountIn();
        // The actual sequence begins now — start chime then the timer (the
        // existing Start behavior, just deferred past the count-in).
        playStart();
        timer.start();
      } else {
        setCountIn(remaining);
      }
    }, 1000);
  };

  // Clean up the count-in ticker on unmount.
  useEffect(() => () => {
    if (countInRef.current) clearInterval(countInRef.current);
  }, []);

  const onPressStartStop = () => {
    if (countIn !== null) {
      stopCountIn(); // cancel the count-in (sequence never started)
      return;
    }
    if (timer.isRunning) {
      timer.stop();
      return;
    }
    // Fresh start (at the beginning or after finishing) gets the count-in;
    // resuming a paused sequence starts immediately, as before.
    const fresh = timer.view.finished || timer.view.totalRemaining >= effectiveTotalSec;
    if (fresh) {
      beginCountIn();
    } else {
      playStart();
      timer.start();
    }
  };

  // Report to the tab bar so an accidental tab tap mid-session (incl. during
  // the count-in) is confirmed.
  useReportActiveTimer("breath", active);

  const persist = (over: Partial<Parameters<typeof storeData>[1]>) => {
    storeData(BREATH_DATA_KEY, {
      breathPatternId: patternId,
      breathTotalSec: totalSec,
      breathClick: clickId,
      breathDownbeat: downbeatId,
      breathAmbience: ambienceId,
      breathCustomCounts: customCounts,
      ...over,
    });
  };

  const choosePattern = (p: BreathPattern) => {
    if (active) return;
    timer.reset();
    setPatternId(p.id);
    persist({ breathPatternId: p.id });
  };

  const editCount = (key: EditFieldKey, value: number) => {
    if (active) return;
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
        countIn={countIn}
        endsOnExhale={endsOnExhale}
        onInfoPress={showExhaleInfo}
        onPressClock={() => {
          setPickerSec(effectiveTotalSec);
          setShowPicker(true);
        }}
      />

      <View style={styles.controls}>
        <CountEditors
          pattern={pattern}
          activeKind={timer.isRunning && !metro ? timer.view.kind : undefined}
          onChange={editCount}
          disabled={active}
        />

        <PatternPicker selectedId={pattern.id} onSelect={choosePattern} disabled={active} />

        {!metro && (
          <TouchableOpacity
            style={styles.downbeatToggle}
            activeOpacity={0.7}
            disabled={active}
            onPress={() => setDownbeatEnabled(patternId, !patternDownbeatOn)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: patternDownbeatOn }}
          >
            <View style={[styles.dbBox, patternDownbeatOn && styles.dbBoxOn]}>
              {patternDownbeatOn ? <Text style={styles.dbTick}>{"✓"}</Text> : null}
            </View>
            <Text style={styles.dbLabel}>Downbeat snap on each count</Text>
          </TouchableOpacity>
        )}

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
          disabled={active}
          downbeatId={metro ? undefined : downbeatId}
          onDownbeatChange={
            metro
              ? undefined
              : (id) => {
                  setDownbeatId(id);
                  persist({ breathDownbeat: id });
                }
          }
          downbeatDisabled={!patternDownbeatOn}
        />
      </View>

      {/* Bottom-anchored like the yoga tab's button (same shared container),
          so switching tabs doesn't make the button appear to jump. */}
      <View style={screenStyles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.startBtn, active && styles.stopBtn]}
          onPress={onPressStartStop}
        >
          <Text style={[styles.startText, active && styles.stopText]}>
            {active ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>

      <TimerPickerModal
        visible={showPicker}
        setIsVisible={setShowPicker}
        initialValue={getTimeParts(effectiveTotalSec)}
        onDurationChange={(d) =>
          setPickerSec(d.hours * 3600 + d.minutes * 60 + d.seconds)
        }
        onConfirm={(picked) => {
          const newTotal = picked.hours * 3600 + picked.minutes * 60 + picked.seconds;
          setTotalSec(newTotal);
          setShowPicker(false);
          timer.reset();
          persist({ breathTotalSec: newTotal });
        }}
        modalTitle={pickerTitle}
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
  screen: { flex: 1, backgroundColor: t.bg, paddingHorizontal: t.space.lg },
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
  stopBtn: { borderColor: t.accentSoft }, // light green while running (matches yoga/HIIT)
  startText: { color: t.buttonText, fontSize: 20, fontWeight: "600", letterSpacing: 1 },
  stopText: { color: t.accentSoft },
  downbeatToggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  dbBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: t.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dbBoxOn: { backgroundColor: t.accentSoft, borderColor: t.accentSoft },
  dbTick: { color: t.bg, fontSize: 13, fontWeight: "900", lineHeight: 15 },
  dbLabel: { color: t.muted, fontSize: 14 },
});
