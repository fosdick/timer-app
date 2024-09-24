import { Audio } from 'expo-av';
import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import { useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Slider from '@react-native-community/slider';
import { TimerPickerModal } from "react-native-timer-picker";


Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
});
const DEFAULT_BEAT_INTERVAL = 3;
const DEFAULT_BEAT_COUNT = 0;

export default function Metronome() {

    const [totalTime, setTotalTime] = useState(0);
    const [isStop, setIsStop] = useState(true);

    const [showPicker, setShowPicker] = useState(false);
    const [alarmString, setAlarmString] = useState<string | null>("00:00:00");

    const [beatInterval, setBeatInterval] = useState(DEFAULT_BEAT_INTERVAL);
    const [beatCount, setBeatCount] = useState(DEFAULT_BEAT_COUNT);

    
    const getRemainingTime = () => {
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60
        return {
            hours, minutes, seconds
        }
    }

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
    
    
    const playBeat = () => {
        async function playSound() {
            const { sound } = await Audio.Sound.createAsync( require('../assets/sounds/sticks-low-1.wav'));
            await sound.playAsync();
          }
        playSound()
    }
    const playEndChime = () => {
        async function playSound() {
            const { sound } = await Audio.Sound.createAsync( require('../assets/sounds/sticks-low-1.wav'));
            await sound.playAsync();
          }
        playSound()
    }
    useEffect(() => {
        
        const intervalid: any = setTimeout(() => {
          if (!isStop && totalTime >= 0) {
           setTotalTime(totalTime - 1);
           setBeatCount(beatCount + 1);
           if (beatCount % beatInterval === 0 && beatCount !== 0) {
            playBeat();
           }
            setAlarmString(formatTime(getRemainingTime()));
            if (totalTime === 0) {
                setIsStop(true);
              }
          }
          
          
        }, 1000);
          return () => clearInterval(intervalid);
        });
    return (

      <View style={{backgroundColor: "#514242", alignItems: "center", justifyContent: "center"}}>
        
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
                            Set Time 🔔
                        </Text>
                    </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsStop(!isStop)}>
                    
                    <View style={{marginTop: 30}}>
                        <Text style={styles.timePicker}>
                            {isStop === true ? "Start" : "Stop"}
                        </Text>
                    </View>
                    </TouchableOpacity>
                    <View><Text style={styles.metronome}>
                        Metronome Count (seconds)
                    </Text></View>
                    <View><Text style={styles.metronome}>
                        {beatInterval}
                    </Text></View>
                    <Slider
  style={{width: 200, height: 40}}
  minimumValue={0}
  maximumValue={20}
  step={1}
  value={DEFAULT_BEAT_INTERVAL}
  minimumTrackTintColor="#FFFFFF"
  maximumTrackTintColor="#000000"
            onValueChange={(val) => setBeatInterval(val)}
  onSlidingComplete={(val) => setBeatInterval(val)}
/>
                
            </View>
        </TouchableOpacity>
        <TimerPickerModal
        initialValue={{hours: 0, minutes: 0, seconds: 0}}
            visible={showPicker}
            setIsVisible={setShowPicker}
            onConfirm={(pickedDuration) => {
                setTotalTime((pickedDuration.hours * 3600) + (pickedDuration.minutes * 60) + (pickedDuration.seconds));
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
   
    </View>
    );
}


const styles = StyleSheet.create({
    timePicker: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderRadius: 10,
      fontSize: 16,
      overflow: "hidden",
      borderColor: "#C2C2C2",
      color: "#C2C2C2"
      },
      metronome: {
        marginTop:30,
        paddingVertical: 10,
        paddingHorizontal: 18,
        fontSize: 16,
        overflow: "hidden",
        borderColor: "#C2C2C2",
        color: "#C2C2C2"
        }
  });