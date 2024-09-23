import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, View, Text, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { TimerPickerModal } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import { useEffect, useState} from 'react';

import { Audio } from 'expo-av';


const formatTime = ({
    hours,
    minutes,
    seconds,
}: {
    hours?: number;
    minutes?: number;
    seconds?: number;
}) => {
    const timeParts = [];

    if (hours !== undefined) {
        timeParts.push(hours.toString().padStart(2, "0"));
    }
    if (minutes !== undefined) {
        timeParts.push(minutes.toString().padStart(2, "0"));
    }
    if (seconds !== undefined) {
        timeParts.push(seconds.toString().padStart(2, "0"));
    }

    return timeParts.join(":");
};
const alarmStringExample = null;

export default function TabTwoScreen() {

  const [showPicker, setShowPicker] = useState(false);
const [alarmString, setAlarmString] = useState<
        string | null
    >(null);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Pranayama Timer</ThemedText>
      </ThemedView>
      <View style={{backgroundColor: "#514242", alignItems: "center", justifyContent: "center"}}>
        <Text style={{fontSize: 18, color: "#F1F1F1"}}>
            {alarmStringExample !== null
                ? "Alarm set for"
                : "No alarm set"}
        </Text>
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}>
            <View style={{alignItems: "center"}}>
                {alarmString !== null ? (
                    <Text style={{color: "#F1F1F1", fontSize: 48}}>
                        {alarmString}
                    </Text>
                ) : null}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPicker(true)}>
                    <View style={{marginTop: 30}}>
                        <Text style={styles.timePicker}>
                            Set Alarm 🔔
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
        <TimerPickerModal
            visible={showPicker}
            setIsVisible={setShowPicker}
            onConfirm={(pickedDuration) => {
                setAlarmString(formatTime(pickedDuration));
                setShowPicker(false);
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
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timePicker: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    overflow: "hidden",
    borderColor: "#C2C2C2",
    color: "#C2C2C2"
    }
});
