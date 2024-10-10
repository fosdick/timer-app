import { TimerPickerModal } from "react-native-timer-picker";
import { TimerStyles } from "@/assets/styles/timer-app";
import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import {
  formatMinutesSeonds,
  getTimePartsMinSec,
} from "../assets/utils/format-time";

export default function HittIntervalPicker(props: any) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDisplayTimeString, setPickerDisplayTimeString] =
    useState<string>(props.pickerDisplayTimeString || "00:00");

  return (
    <View style={TimerStyles.metronomeTheme}>
      <Text style={TimerStyles.metronome}>{props.textTitle}</Text>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPicker(true)}>
        <View style={{ alignItems: "center" }}>
          {pickerDisplayTimeString !== null ? (
            <Text style={TimerStyles.timerFace}>
              {props.pickerDisplayTimeString}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <TimerPickerModal
        initialValue={getTimePartsMinSec(
          props.initialTotalTime.initialTotalTime
        )}
        visible={showPicker}
        setIsVisible={setShowPicker}
        onConfirm={(pickedDuration) => {
          setShowPicker(false);
          props.setIntervalDisplayString.setIntervalDisplayString(
            formatMinutesSeonds(pickedDuration)
          );
          props.setInitialTotalTime.setInitialTotalTime(
            pickedDuration.minutes * 60 + pickedDuration.seconds
          );
          props.setCurrentTotalTime.setCurrentTotalTime(
            pickedDuration.minutes * 60 + pickedDuration.seconds
          );
          props.resetAllEmit.resetAllEmit();
        }}
        hideHours={true}
        modalTitle="Interval Length"
        onCancel={() => setShowPicker(false)}
        closeOnOverlayPress
        // Audio={Audio}
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
