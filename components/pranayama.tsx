import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Slider from "@react-native-community/slider";
import { TimerPickerModal } from "react-native-timer-picker";
import { TimerStyles, GreenTheme } from "@/assets/styles/timer-app";
import { formatTime, getTimeParts } from "../assets/utils/format-time";
import { playBeat, playEndChime } from "../assets/utils/sounds";
import { Audio } from "expo-av";

const PRANAYAMA_TIMER_APP_DATA: string = "pranayama_timer_app_data";
type PranayamaTimerAppData = {
  beatInterval: number;
  lastTotalTime: number;
};
const storePersistenceData = async (value: PranayamaTimerAppData) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(PRANAYAMA_TIMER_APP_DATA, jsonValue);
  } catch (e) {
    // saving error
  }
};

const getPersistenceData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PRANAYAMA_TIMER_APP_DATA);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};

const DEFAULT_BEAT_INTERVAL = 3;
const DEFAULT_BEAT_COUNT = 0;
const DEFAULT_METRONOME_ON = true;
const DEFAULT_TIMER_LENGTH = 5 * 60;

export default function Metronome() {
  const [isMetronomeEnabled, setIsMetronomeEnabled] =
    useState(DEFAULT_METRONOME_ON);
  const toggleMetronomeEnabled = () => {
    setIsMetronomeEnabled(!isMetronomeEnabled);
  };
  const getRemainingTime = () => {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return {
      hours,
      minutes,
      seconds,
    };
  };

  const [totalTime, setTotalTime] = useState(DEFAULT_TIMER_LENGTH);
  const [isStop, setIsStop] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [alarmString, setAlarmString] = useState<string | null>(
    formatTime(getRemainingTime())
  );

  const [beatInterval, setBeatInterval] = useState(DEFAULT_BEAT_INTERVAL);
  const [beatCount, setBeatCount] = useState(DEFAULT_BEAT_COUNT);

  const [lastTotalTime, setLastTotalTiime] = useState();

  useEffect(() => {
    // setTotalTime(pranayamaTimerAppData.lastTotalTime ? pranayamaTimerAppData.lastTotalTime : 0);

    const intervalid: any = setTimeout(() => {
      if (!isStop && totalTime >= 0) {
        setTotalTime(totalTime - 1);
        setBeatCount(beatCount + 1);
        if (
          beatCount % beatInterval === 0 &&
          beatCount !== 0 &&
          isMetronomeEnabled
        ) {
          playBeat();
        }
        setAlarmString(formatTime(getRemainingTime()));
        if (totalTime === 0) {
          setIsStop(true);
          playEndChime();
        }
      }
    }, 1000);
    return () => clearInterval(intervalid);
  });
  return (
    <View style={TimerStyles.metronomeTheme}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
        <View style={{ alignItems: "center" }}>
          {alarmString !== null ? (
            <Text style={TimerStyles.timerFace}>{alarmString}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsStop(!isStop)}
          >
            <View style={TimerStyles.marginTop}>
              <Text style={TimerStyles.startButton}>
                {isStop === true ? "Start" : "Stop"}
              </Text>
            </View>
          </TouchableOpacity>
          <View>
            <Text style={TimerStyles.metronome}>Metronome Count (seconds)</Text>
          </View>
          <View>
            <Text style={TimerStyles.valueText}>{beatInterval}</Text>
          </View>
          <Slider
            style={{ width: 200, height: 40 }}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={DEFAULT_BEAT_INTERVAL}
            minimumTrackTintColor={GreenTheme.thumbColorEnabled}
            maximumTrackTintColor={GreenTheme.trackColorTrue}
            onValueChange={(val) => setBeatInterval(val)}
            onSlidingComplete={(val) => setBeatInterval(val)}
            thumbTintColor={GreenTheme.trackColorTrue}
          />
        </View>
      </TouchableOpacity>
      <TimerPickerModal
        initialValue={getTimeParts(DEFAULT_TIMER_LENGTH)}
        visible={showPicker}
        setIsVisible={setShowPicker}
        onConfirm={(pickedDuration) => {
          setTotalTime(
            pickedDuration.hours * 3600 +
              pickedDuration.minutes * 60 +
              pickedDuration.seconds
          );
          setAlarmString(formatTime(pickedDuration));
          setShowPicker(false);
          setIsStop(true);
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
      <View>
        <Text style={TimerStyles.valueText}>
          Metronome {isMetronomeEnabled ? "On" : "Off"}
        </Text>
      </View>
      <Switch
        trackColor={{
          false: GreenTheme.thumbColorDisabled,
          true: GreenTheme.thumbColorEnabled,
        }}
        thumbColor={GreenTheme.trackColorFalse}
        // ios_backgroundColor="#3e3e3e"
        onValueChange={toggleMetronomeEnabled}
        value={isMetronomeEnabled}
      />
    </View>
  );
}
