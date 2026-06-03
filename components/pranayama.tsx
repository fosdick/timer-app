import { LinearGradient } from "expo-linear-gradient";

import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  // Seconds remaining until the next chime — counts down N → 1 → N → 1...
  // Stays at N when stopped. Resets at the moment of each chime.
  const secondsToNextChime = beatInterval - (beatCount % beatInterval);

  // Which cell in the visual grid is currently "live" — the count of completed
  // chimes since start, modulo the grid size. Stays at 0 until the first chime
  // fires, then advances cell-by-cell, wrapping at VISUAL_GRID_CELLS.
  const currentCellIndex =
    Math.floor(beatCount / beatInterval) % VISUAL_GRID_CELLS;

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

      {/* Spacer pushes the bottom group toward the Start button */}
      <View style={{ flex: 1 }} />

      {/* Bottom group: per-beat countdown + interval stepper, near Start */}
      <View style={styles.bottomGroup}>
        <Text style={PranayamaStyles.metronomeCount}>{secondsToNextChime}</Text>
        <Text style={[PranayamaStyles.metronomeLabel, styles.bottomLabel]}>
          Metronome Count (seconds)
        </Text>
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

  bottomGroup: {
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  // Tighten the gap between the label and the stepper below it.
  bottomLabel: {
    marginBottom: 12,
  },
});
