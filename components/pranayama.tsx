import { LinearGradient } from "expo-linear-gradient";

import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  TimerStyles,
  PranayamaStyles,
  colorTheme,
  screenStyles,
} from "@/assets/styles/timer-app";
import { formatTime, getTimeParts } from "../assets/utils/format-time";
import { playEndChime, playSnap, playStart } from "../assets/utils/sounds";
import { Audio } from "expo-av";
import { getData, storeData } from "../assets/utils/persistent-storage";
import { PauseStepper } from "./timer-settings-panel";
import {
  VILOMA,
  getCycleDuration,
  getPhaseAtTime,
} from "@/assets/data/pranayama-patterns";
import {
  HOLD_AMBIENCES,
  DEFAULT_HOLD_AMBIENCE,
  getAmbience,
} from "@/assets/data/hold-ambiences";

const PRANAYAMA_TIMER_APP_DATA: string = "pranayama_timer_app_data";

const DEFAULT_BEAT_INTERVAL = 3;
const DEFAULT_BEAT_COUNT = 0;
const DEFAULT_TIMER_LENGTH = 300;

// Pranayama interval (chime cadence) — 1s steps from 1s to 20s.
const BEAT_INTERVAL_MIN_MS = 1000;
const BEAT_INTERVAL_MAX_MS = 20000;
const BEAT_INTERVAL_STEP_MS = 1000;

export default function Pranayama() {
  const getRemainingTime = () => {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime - hours * 3600) / 60);
    const seconds = totalTime % 60;
    return {
      hours,
      minutes,
      seconds,
    };
  };
  const [initialTotalTime, setInitialTotalTime] =
    useState<number>(DEFAULT_TIMER_LENGTH);
  const [totalTime, setTotalTime] = useState<number>(DEFAULT_TIMER_LENGTH);
  const [isStop, setIsStop] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [alarmString, setAlarmString] = useState<string | null>(
    formatTime(getRemainingTime()),
  );

  const [beatInterval, setBeatInterval] = useState(DEFAULT_BEAT_INTERVAL);
  const [beatCount, setBeatCount] = useState(DEFAULT_BEAT_COUNT);

  // Viloma toggle. When OFF: original metronome behavior, no visuals.
  // When ON: chime cadence locks to Viloma's unit; during long-hold phases
  // (Antara/Bahya Kumbhaka) the chime stops, a Sanskrit phase label
  // appears, an ocean-blue progress bar fills, and an ocean sound bed plays.
  const [vilomaActive, setVilomaActive] = useState(false);

  // Which looping sound bed plays during long holds (Antara/Bahya Kumbhaka).
  const [holdAmbience, setHoldAmbience] = useState(DEFAULT_HOLD_AMBIENCE);

  // ─── Pattern (Viloma) ────────────────────────────────────────────────────
  // Elapsed seconds since the timer started (initial − remaining). Reduced
  // mod the cycle duration gives us where we are in the current Viloma cycle.
  const elapsedSeconds = initialTotalTime - totalTime;
  const vilomaCycleDuration = getCycleDuration(VILOMA);
  const phaseAtTime = vilomaActive
    ? getPhaseAtTime(VILOMA, elapsedSeconds % vilomaCycleDuration)
    : null;
  // Are we currently inside a long-hold phase (Antara/Bahya Kumbhaka)?
  // Drives the ocean sound, progress bar, and chime suppression.
  const isInLongHold =
    vilomaActive && (phaseAtTime?.phase.isLongHold ?? false);

  const toggleViloma = () => {
    if (!vilomaActive) {
      // Activating: lock chime cadence to Viloma's unit and reset beatCount
      // so phase 0 (Inhale) begins cleanly on the next Start.
      setBeatInterval(VILOMA.unitSeconds);
      setBeatCount(0);
    }
    setVilomaActive(!vilomaActive);
  };

  const resetTimer = async () => {
    setTotalTime(initialTotalTime);
    setAlarmString(formatTime(getTimeParts(initialTotalTime)));
    setBeatCount(0);
  };
  const saveStoredData = (overrides?: {
    totalTime?: number;
    beatInterval?: number;
    holdAmbience?: string;
  }) => {
    storeData(PRANAYAMA_TIMER_APP_DATA, {
      totalTime: overrides?.totalTime ?? initialTotalTime,
      beatInterval: overrides?.beatInterval ?? beatInterval,
      holdAmbience: overrides?.holdAmbience ?? holdAmbience,
    });
  };
  useState(async () => {
    const savedData = await getData(PRANAYAMA_TIMER_APP_DATA);
    setBeatInterval(savedData?.beatInterval || DEFAULT_BEAT_INTERVAL);
    setTotalTime(savedData?.totalTime || DEFAULT_TIMER_LENGTH);
    setInitialTotalTime(savedData?.totalTime || DEFAULT_TIMER_LENGTH);
    setHoldAmbience(savedData?.holdAmbience || DEFAULT_HOLD_AMBIENCE);
    if (savedData?.totalTime) {
      setAlarmString(formatTime(getTimeParts(savedData.totalTime)));
    }
  });

  // ─── Ocean sound during long holds ───────────────────────────────────────
  // The chime ↔ ocean swap is mutually exclusive. When isInLongHold becomes
  // true we start the looped ocean wave; when it goes false we stop it.
  // Cancellation flag handles the case where the user toggles off Viloma
  // (or otherwise leaves the hold) before createAsync resolves.
  const oceanSoundRef = useRef<Audio.Sound | null>(null);
  useEffect(() => {
    const asset = getAmbience(holdAmbience).asset;
    if (!isInLongHold || asset == null) return; // "None" => silent hold
    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(asset, {
          isLooping: true,
        });
        if (cancelled) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        oceanSoundRef.current = sound;
        await sound.playAsync();
      } catch {
        // sound load failed — silently degrade; the visual still works
      }
    })();
    return () => {
      cancelled = true;
      if (oceanSoundRef.current) {
        const s = oceanSoundRef.current;
        oceanSoundRef.current = null;
        s.stopAsync().catch(() => {});
        s.unloadAsync().catch(() => {});
      }
    };
  }, [isInLongHold, holdAmbience]);
  // Belt-and-suspenders unmount cleanup so an in-flight ocean sound never
  // outlives the screen.
  useEffect(() => {
    return () => {
      if (oceanSoundRef.current) {
        const s = oceanSoundRef.current;
        oceanSoundRef.current = null;
        s.stopAsync().catch(() => {});
        s.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // ─── Progress-bar animation ──────────────────────────────────────────────
  // Smoothly tween the bar each tick toward the current within-phase fraction.
  // Because phaseAtTime is only recomputed when the timer ticks, a paused
  // practice naturally freezes the bar in place. When the long hold ends we
  // tween back to 0; when Viloma is toggled off mid-hold we also tween to 0.
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let target = 0;
    if (isInLongHold && phaseAtTime) {
      const elapsedInPhase =
        phaseAtTime.phase.durationSeconds - phaseAtTime.remainingInPhase;
      target = elapsedInPhase / phaseAtTime.phase.durationSeconds;
    }
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 1000,
      useNativeDriver: false, // animating width requires JS driver
    }).start();
  }, [
    isInLongHold,
    phaseAtTime?.index,
    phaseAtTime?.remainingInPhase,
    progressAnim,
  ]);

  // ─── Timer tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    const intervalId = setTimeout(() => {
      if (!isStop && totalTime >= 0) {
        const nextBeatCount = beatCount + 1;
        const nextTotalTime = totalTime - 1;
        setTotalTime(nextTotalTime);
        setBeatCount(nextBeatCount);
        // Snap on each beat boundary — EXCEPT when the next tick lands in a
        // long-hold phase (the ocean takes over there). Computed against
        // post-tick state so the boundary tick aligns with phase transitions.
        if (nextBeatCount % beatInterval === 0) {
          const enteringLongHold =
            vilomaActive &&
            (getPhaseAtTime(
              VILOMA,
              (initialTotalTime - nextTotalTime) % vilomaCycleDuration,
            ).phase.isLongHold ?? false);
          if (!enteringLongHold) {
            playSnap();
          }
        }
        setAlarmString(formatTime(getTimeParts(nextTotalTime)));
        if (nextTotalTime === 0) {
          setIsStop(true);
          playEndChime();
          resetTimer();
        }
      }
    }, 1000);
    return () => clearInterval(intervalId);
  });

  return (
    <View style={screenStyles.contentContainer}>
      {/* Top: total-time remaining */}
      <View style={TimerStyles.vertBox}>
        <View style={TimerStyles.marginTop}>
          <Text style={PranayamaStyles.mainLabel}>Remaining</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPicker(true)}
        >
          <View style={{ alignItems: "center" }}>
            {alarmString !== null ? (
              <Text style={PranayamaStyles.mainCountdown}>{alarmString}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TimerPickerModal
          initialValue={getTimeParts(initialTotalTime)}
          visible={showPicker}
          setIsVisible={setShowPicker}
          onConfirm={(pickedDuration) => {
            setTotalTime(
              pickedDuration.hours * 3600 +
                pickedDuration.minutes * 60 +
                pickedDuration.seconds,
            );
            setInitialTotalTime(
              pickedDuration.hours * 3600 +
                pickedDuration.minutes * 60 +
                pickedDuration.seconds,
            );
            setAlarmString(formatTime(pickedDuration));
            setShowPicker(false);
            setIsStop(true);
            setBeatCount(0);
            saveStoredData({
              totalTime:
                pickedDuration.hours * 3600 +
                pickedDuration.minutes * 60 +
                pickedDuration.seconds,
            });
          }}
          modalTitle="Set Alarm"
          onCancel={() => setShowPicker(false)}
          closeOnOverlayPress
          Audio={Audio}
          LinearGradient={LinearGradient}
          styles={{
            theme: "dark",
          }}
          modalProps={{
            overlayOpacity: 0.2,
          }}
        />
      </View>

      {/* Long-hold treatment — visible only when Viloma is active AND we're
          inside an Antara/Bahya Kumbhaka phase. Decorative Sanskrit label
          above; ocean-themed progress bar below. */}
      {isInLongHold && phaseAtTime && (
        <View style={styles.longHoldContainer}>
          <Text style={styles.sanskritLabel}>{phaseAtTime.phase.label}</Text>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFillContainer,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={["#80DEEA", "#0277BD"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressBarGradient}
              />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Spacer pushes the bottom group toward the Start button */}
      <View style={{ flex: 1 }} />

      {/* Bottom group: static interval number, label, toggle, stepper */}
      <View style={styles.bottomGroup}>
        {/* Pattern toggle — low visual weight. Future: replaced by a proper
            pattern picker when the curated library lands. */}
        <View style={styles.patternToggleRow}>
          <Switch
            value={vilomaActive}
            onValueChange={toggleViloma}
            trackColor={{
              false: colorTheme.controlInactive,
              true: colorTheme.controlActive,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colorTheme.controlInactive}
          />
          <Text style={styles.patternToggleLabel}>Viloma</Text>
        </View>

        {/* Hold ambience picker — the looping bed during Antara/Bahya Kumbhaka.
            Only relevant when Viloma is on (that's when long holds happen). */}
        {vilomaActive && (
          <View style={styles.ambienceRow}>
            <Text style={styles.ambienceLabel}>Hold sound</Text>
            <View style={styles.ambienceChips}>
              {HOLD_AMBIENCES.map((a) => {
                const active = holdAmbience === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setHoldAmbience(a.id);
                      saveStoredData({ holdAmbience: a.id });
                    }}
                    style={[styles.ambienceChip, active && styles.ambienceChipActive]}
                  >
                    <Text
                      style={[
                        styles.ambienceChipText,
                        active && styles.ambienceChipTextActive,
                      ]}
                    >
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Static interval display — shows the current beatInterval value.
            Does NOT count down; it's a label for the chime cadence, not a
            per-second visual the user has to track. */}
        <Text style={PranayamaStyles.metronomeCount}>{beatInterval}</Text>
        <Text style={[PranayamaStyles.metronomeLabel, styles.intervalLabel]}>
          Metronome Count (seconds)
        </Text>

        <PauseStepper
          valueMs={beatInterval * 1000}
          onChange={(ms) => {
            const seconds = Math.round(ms / 1000);
            setBeatInterval(seconds);
            setBeatCount(0);
            saveStoredData({ beatInterval: seconds });
          }}
          minMs={BEAT_INTERVAL_MIN_MS}
          maxMs={BEAT_INTERVAL_MAX_MS}
          stepMs={BEAT_INTERVAL_STEP_MS}
          formatValue={(ms) => `${Math.round(ms / 1000)}s`}
          // Viloma's phase boundaries depend on the 2s unit. Lock the
          // stepper while it's active so the practice stays aligned.
          disabled={vilomaActive}
        />
      </View>

      {/* Start / Stop */}
      <View style={screenStyles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setIsStop(!isStop);
            if (isStop) {
              playStart();
            }
          }}
        >
          <View>
            <Text style={TimerStyles.startButton}>
              {isStop === true ? "Start" : "Stop"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Long-hold treatment (Sanskrit label + ocean progress bar) ───────────
  longHoldContainer: {
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: 36,
  },
  sanskritLabel: {
    // Decorative — italic serif, lighter weight, generous spacing. Reads more
    // as a name to honor than as a label to read at a glance.
    fontFamily: "Georgia",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 24,
    letterSpacing: 2,
    color: "#80DEEA",
    textAlign: "center",
    marginBottom: 18,
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(128, 222, 234, 0.12)",
    overflow: "hidden",
  },
  progressBarFillContainer: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarGradient: {
    flex: 1,
    height: "100%",
  },

  // ─── Bottom group ────────────────────────────────────────────────────────
  bottomGroup: {
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  intervalLabel: {
    marginBottom: 12,
  },

  // ─── Hold ambience picker ────────────────────────────────────────────────
  ambienceRow: {
    alignItems: "center",
    marginBottom: 18,
  },
  ambienceLabel: {
    color: "#90A4AE",
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  ambienceChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  ambienceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(128, 222, 234, 0.35)",
  },
  ambienceChipActive: {
    backgroundColor: "#0277BD",
    borderColor: "#0277BD",
  },
  ambienceChipText: {
    color: "#80DEEA",
    fontSize: 13,
  },
  ambienceChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Pattern toggle row
  patternToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  patternToggleLabel: {
    color: "#689F38",
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});
