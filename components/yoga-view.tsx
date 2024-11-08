import { Audio } from "expo-av";
import {
  playBeat,
  playEndChime,
  playStart,
  playYogaTransition,
} from "../assets/utils/sounds";
import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { TimerPickerModal } from "react-native-timer-picker";
import { TimerStyles } from "@/assets/styles/timer-app";
import {
  formatMinutesSeconds,
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
    setInitialTotalTime(
      savedData?.yogaTotalInterval || DEFAULT_INITIAL_TOTAL_TIME
    );
    setIntervalAlarmString(
      formatMinutesSeconds(
        getTimePartsMinSec(
          savedData?.yogaTotalInterval || DEFAULT_INITIAL_TOTAL_TIME
        )
      )
    );
  });
  const waitTransition: any = async () => {
    const id: any = setTimeout(() => {
      playYogaTransition();
    }, 3500);
  };
  const [isTransition, setIsTransition] = useState<boolean>(false);
  const TRANSITION_LOOP_VALUE = 4;
  const [transCount, setTransCount] = useState<number>(TRANSITION_LOOP_VALUE);

  useEffect(() => {
    // setTotalTime(pranayamaTimerAppData.lastTotalTime ? pranayamaTimerAppData.lastTotalTime : 0);

    const intervalId: any = setTimeout(() => {
      setCurrentTime(new Date());

      if (!isStop && totalTime >= 0) {
        if (!isTransition && totalTime + 1 <= initialTotalTime) {
          setTotalTime(totalTime + 1);
        }
        if (
          isTransition ||
          (totalTime === initialTotalTime && initialTotalTime >= 0)
        ) {
          if (TRANSITION_LOOP_VALUE === transCount) {
            playYogaTransition();
          }

          setIsTransition(true);
          setTransCount(transCount - 1);

          if (transCount === 0) {
            setTotalTime(0);
            setTransCount(TRANSITION_LOOP_VALUE);
            setIsTransition(false);
          }
        }
        if (initialTotalTime > 0) {
          setIntervalAlarmString(formatMinutesSeconds(getTimeRemaining()));
        }
      }
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  });

  const formatedTime: string = currentTime.toLocaleString("en-US", {
    timeStyle: "medium",
  });
  const [h, m, s, pam] = formatedTime.split(/:|\s/);

  return (
    <View style={TimerStyles.vertBox}>
      <View style={TimerStyles.vertBox}>
        <View style={TimerStyles.marginTop}>
          <Text style={TimerStyles.valueText}>Remaining</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPicker(true)}
        >
          <View style={{ alignItems: "center" }}>
            {intervalAlarmString !== null ? (
              <Text style={TimerStyles.timerFace}>{intervalAlarmString}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      <View style={TimerStyles.vertBox}></View>
      <View style={TimerStyles.vertBox}>
        <View style={TimerStyles.marginTop}>
          <Text style={TimerStyles.valueText}>Current Time</Text>
        </View>
        <Text style={TimerStyles.timerFaceSmall}>
          {h}:{m}:{s} <Text style={TimerStyles.small}>{pam}</Text>
        </Text>
      </View>
      <View
        style={[
          TimerStyles.vertBox,
          { alignSelf: "baseline", marginBottom: 32 },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setIsStop(!isStop);
            if (isStop) {
              playStart();
            }
          }}
        >
          <View style={TimerStyles.marginTop}>
            <Text style={TimerStyles.startButton}>
              {isStop === true ? "Start" : "Stop"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TimerPickerModal
        initialValue={getTimePartsMinSec(initialTotalTime)}
        visible={showPicker}
        setIsVisible={setShowPicker}
        onConfirm={(pickedDuration) => {
          setTotalTime(0);
          setInitialTotalTime(
            pickedDuration.minutes * 60 + pickedDuration.seconds
          );
          setIntervalAlarmString(formatMinutesSeconds(pickedDuration));
          // props.setYogaInterval.setYogaInterval(
          //   formatMinutesSeconds(pickedDuration)
          // );
          setShowPicker(false);
          setIsStop(true);
          storeData(YOGA_TIMER_APP_DATA, {
            yogaTotalInterval:
              pickedDuration.minutes * 60 + pickedDuration.seconds,
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
