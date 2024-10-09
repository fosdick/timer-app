import { Audio } from "expo-av";
import { playBeat, playEndChime } from "../assets/utils/sounds";
import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { TimerPickerModal } from "react-native-timer-picker";
import { TimerStyles } from "@/assets/styles/timer-app";
import {
  formatMinutesSeonds,
  formatTime,
  getTimePartsMinSec,
} from "../assets/utils/format-time";
import { getData, storeData } from "../assets/utils/persistant-storage";

const YOGA_TIMER_APP_DATA: string = "yoga_timer_app_data";
const DEFAULT_INITIAL_TOTAL_TIME = 30;
export default function YogaView(props: any) {
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isStop, setIsStop] = useState<boolean>(true);

  const [showPicker, setShowPicker] = useState(false);
  const [intervalAlarmString, setIntervalAlarmString] = useState<string | null>(
    formatTime(getTimePartsMinSec(DEFAULT_INITIAL_TOTAL_TIME))
  );

  const [initialTotalTime, setInitialTotalTime] = useState<number>(
    DEFAULT_INITIAL_TOTAL_TIME
  );

  const getTimeRemaining = () => {
    const remaining = initialTotalTime - totalTime;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return {
      minutes,
      seconds,
    };
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useState(async () => {
    const savedData = await getData(YOGA_TIMER_APP_DATA);
    setInitialTotalTime(
      savedData?.yogaTotalInterval || DEFAULT_INITIAL_TOTAL_TIME
    );
  });
  useEffect(() => {
    // setTotalTime(pranayamaTimerAppData.lastTotalTime ? pranayamaTimerAppData.lastTotalTime : 0);

    const intervalid: any = setTimeout(() => {
      setCurrentTime(new Date());
      if (!isStop && totalTime >= 0) {
        setTotalTime(totalTime + 1);
        if (totalTime === initialTotalTime && initialTotalTime > 0) {
          // playEndChime();
          playBeat();
          setTotalTime(0);
        }
        if (initialTotalTime > 0) {
          setIntervalAlarmString(formatMinutesSeonds(getTimeRemaining()));
        }
      }
    }, 1000);
    return () => clearInterval(intervalid);
  });

  const formatedTime: string = currentTime.toLocaleString("en-US", {
    timeStyle: "medium",
  });
  const [h, m, s, pam] = formatedTime.split(/:|\s/);

  return (
    <View style={[TimerStyles.metronomeTheme, TimerStyles.marginTopXL]}>
      <View style={TimerStyles.metronomeTheme}>
        <Text style={TimerStyles.timerFaceSmall}>
          {h}:{m}:{s} <Text style={TimerStyles.small}>{pam}</Text>
        </Text>
      </View>
      {/* <Text>{JSON.stringify(props.yogaInterval)} beats</Text> */}
      <View style={TimerStyles.marginTop}>
        <Text style={TimerStyles.valueText}>Next Pose In:</Text>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
        <View style={{ alignItems: "center" }}>
          {intervalAlarmString !== null ? (
            <Text style={TimerStyles.timerFace}>{intervalAlarmString}</Text>
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
        </View>
      </TouchableOpacity>
      <TimerPickerModal
        initialValue={getTimePartsMinSec(initialTotalTime)}
        visible={showPicker}
        setIsVisible={setShowPicker}
        onConfirm={(pickedDuration) => {
          setTotalTime(0);
          setInitialTotalTime(
            pickedDuration.minutes * 60 + pickedDuration.seconds
          );
          setIntervalAlarmString(formatMinutesSeonds(pickedDuration));
          // props.setYogaInterval.setYogaInterval(
          //   formatMinutesSeonds(pickedDuration)
          // );
          setShowPicker(false);
          setIsStop(true);
          storeData(YOGA_TIMER_APP_DATA, {
            yogaIntervalTime: pickedDuration,
          });
        }}
        hideHours={true}
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
  );
}