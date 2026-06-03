import { LinearGradient } from "expo-linear-gradient";

import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
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

const PRANAYAMA_TIMER_APP_DATA: string = "pranayama_timer_app_data";

const DEFAULT_BEAT_INTERVAL = 3;
const DEFAULT_BEAT_COUNT = 0;
const DEFAULT_TIMER_LENGTH = 300;

// Pranayama interval (chime cadence) — 1s steps from 1s to 20s.
const BEAT_INTERVAL_MIN_MS = 1000;
const BEAT_INTERVAL_MAX_MS = 20000;
const BEAT_INTERVAL_STEP_MS = 1000;

// Visual grid — number of cells representing the audio beat row.
// One cell per chime; advances on each chime and wraps. Foundation that
// future Pattern overlays will color/label per phase.
const VISUAL_GRID_CELLS = 8;

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

  // Viloma pattern toggle. When active, the chime cadence locks to Viloma's
  // unit (2s) and a phase label overlays the screen. The audio grid still
  // ticks uniformly — the pattern lives in the visual, not the chime cadence.
  const [vilomaActive, setVilomaActive] = useState(false);

  // Which cell in the visual grid is currently "live" — the count of completed
  // chimes since start, modulo the grid size. Stays at 0 until the first chime
  // fires, then advances cell-by-cell, wrapping at VISUAL_GRID_CELLS.
  const currentCellIndex =
    Math.floor(beatCount / beatInterval) % VISUAL_GRID_CELLS;

  // ─── Pattern (Viloma) ────────────────────────────────────────────────────
  // Elapsed seconds since the timer started (initial − remaining). Reduced
  // mod the cycle duration gives us where we are in the current Viloma cycle.
  const elapsedSeconds = initialTotalTime - totalTime;
  const vilomaCycleDuration = getCycleDuration(VILOMA);
  const phaseAtTime = vilomaActive
    ? getPhaseAtTime(VILOMA, elapsedSeconds % vilomaCycleDuration)
    : null;

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
  const saveStoredData = (totalTimeVal?: number) => {
    storeData(PRANAYAMA_TIMER_APP_DATA, {
      totalTime: totalTimeVal || initialTotalTime,
      beatInterval,
    });
  };
  useState(async () => {
    const savedData = await getData(PRANAYAMA_TIMER_APP_DATA);
    setBeatInterval(savedData?.beatInterval || DEFAULT_BEAT_INTERVAL);
    setTotalTime(savedData?.totalTime || DEFAULT_TIMER_LENGTH);
    setInitialTotalTime(savedData?.totalTime || DEFAULT_TIMER_LENGTH);
    if (savedData?.totalTime) {
      setAlarmString(formatTime(getTimeParts(savedData.totalTime)));
    }
  });
  useEffect(() => {
    const intervalId = setTimeout(() => {
      if (!isStop && totalTime >= 0) {
        const nextBeatCount = beatCount + 1;
        const nextTotalTime = totalTime - 1;
        setTotalTime(nextTotalTime);
        setBeatCount(nextBeatCount);
        // Snap when crossing a beat-interval boundary. Using the *next* beat
        // count aligns the audible chime with the on-screen countdown — when
        // the display shows the new beatInterval value (the just-reset "3"),
        // the user simultaneously hears the snap. No initial-tick guard is
        // needed: at beatInterval=3 the first qualifying tick is at t=3, not t=0.
        if (nextBeatCount % beatInterval === 0) {
          playSnap();
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
            saveStoredData(
              pickedDuration.hours * 3600 +
                pickedDuration.minutes * 60 +
                pickedDuration.seconds,
            );
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

      {/* Visual grid — row of beat cells, current one highlighted.
          Foundation for future Pattern overlays (phase labels/colors). */}
      <View style={styles.visualGridContainer}>
        <View style={styles.visualGridRow}>
          {Array.from({ length: VISUAL_GRID_CELLS }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.gridCell,
                idx === currentCellIndex && styles.gridCellActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Pattern phase label — only visible when Viloma is active. The chime
          cadence does not change; this is the visual face of the pattern. */}
      {phaseAtTime && (
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseLabel}>
            {phaseAtTime.phase.label.toUpperCase()}
          </Text>
          <Text style={styles.phaseRemaining}>
            {phaseAtTime.remainingInPhase}s in phase
          </Text>
        </View>
      )}

      {/* Spacer pushes the bottom group toward the Start button */}
      <View style={{ flex: 1 }} />

      {/* Bottom group: pattern toggle, per-beat countdown, interval stepper */}
      <View style={styles.bottomGroup}>
        {/* Pattern toggle — small row, low visual weight. Future: replaces
            with a proper pattern picker when the curated library lands. */}
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

        <PauseStepper
          valueMs={beatInterval * 1000}
          onChange={(ms) => {
            const seconds = Math.round(ms / 1000);
            setBeatInterval(seconds);
            setBeatCount(0);
            saveStoredData();
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
  visualGridContainer: {
    width: "80%",
    alignSelf: "center",
    marginTop: 36,
    alignItems: "center",
  },
  visualGridRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  gridCell: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colorTheme.controlInactive,
    backgroundColor: "transparent",
  },
  gridCellActive: {
    backgroundColor: colorTheme.controlActive,
    borderColor: colorTheme.controlActive,
    // Subtle scale-up on the active cell so it reads as the "live" one.
    transform: [{ scale: 1.25 }],
  },

  // Pattern phase label (shown when Viloma is active)
  phaseContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  phaseLabel: {
    fontSize: 36,
    fontWeight: "300",
    color: "#CDDC39",
    letterSpacing: 2,
    textAlign: "center",
  },
  phaseRemaining: {
    fontSize: 14,
    fontWeight: "400",
    color: "#689F38",
    marginTop: 6,
    textAlign: "center",
  },

  bottomGroup: {
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
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
