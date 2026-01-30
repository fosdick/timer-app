import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import { useEffect, useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import Slider from "@react-native-community/slider";
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

const PRANAYAMA_TIMER_APP_DATA: string = "pranayama_timer_app_data";

const DEFAULT_BEAT_INTERVAL = 3;
const DEFAULT_BEAT_COUNT = 0;
const DEFAULT_METRONOME_ON = true;
const DEFAULT_TIMER_LENGTH = 300;

export default function Pranayama() {
  const [isMetronomeEnabled, setIsMetronomeEnabled] =
    useState(DEFAULT_METRONOME_ON);
  const toggleMetronomeEnabled = () => {
    setIsMetronomeEnabled(!isMetronomeEnabled);
  };
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
        setTotalTime(totalTime - 1);
        setBeatCount(beatCount + 1);
        if (
          beatCount % beatInterval === 0 &&
          isMetronomeEnabled &&
          totalTime !== initialTotalTime
        ) {
          playSnap();
        }
        setAlarmString(formatTime(getTimeParts(totalTime)));
        if (totalTime === 0) {
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
      <View style={[PranayamaStyles.metronomeCountContainer]}>
        <View style={[TimerStyles.vertBox]}>
          <View>
            <Text style={PranayamaStyles.metronomeCount}>{beatInterval}</Text>
          </View>
          <Text style={PranayamaStyles.metronomeLabel}>
            Metronome Count (seconds)
          </Text>
        </View>
        <View style={PranayamaStyles.sliderContainer}>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={DEFAULT_BEAT_INTERVAL}
            minimumTrackTintColor={colorTheme.controlActive}
            maximumTrackTintColor={colorTheme.controlInactive}
            onValueChange={(val) => {
              setBeatInterval(val);
              setBeatCount(0);
              saveStoredData();
            }}
            onSlidingComplete={(val) => {
              setBeatInterval(val);
              setBeatCount(0);
              saveStoredData();
            }}
            thumbTintColor={colorTheme.controlActive}
          />
        </View>
      </View>
      <View style={PranayamaStyles.toggleContainer}>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Switch
            style={PranayamaStyles.toggleSwitch}
            trackColor={{
              false: colorTheme.controlInactive,
              true: colorTheme.controlActive,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colorTheme.controlInactive}
            onValueChange={toggleMetronomeEnabled}
            value={isMetronomeEnabled}
          />
        </View>
        <Text style={PranayamaStyles.toggleLabel}>
          Metronome {isMetronomeEnabled ? "On" : "Off"}
        </Text>
      </View>
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
