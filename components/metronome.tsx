import { Audio } from 'expo-av';
import { LinearGradient } from "expo-linear-gradient"; // or `import LinearGradient from "react-native-linear-gradient"`

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState} from 'react';
import {StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import Slider from '@react-native-community/slider';
import { TimerPickerModal } from "react-native-timer-picker";

const PRANAYAMA_TIMER_APP_DATA: string = 'pranayama_timer_app_data'
type PranayamaTimerAppData = {
    beatInterval: number,
    lastTotalTime: number,
}
const storePersistenceData  = async (value: PranayamaTimerAppData) => {
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

Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
});
const DEFAULT_BEAT_INTERVAL = 3;
const DEFAULT_BEAT_COUNT = 0;
const DEFAULT_METRONOME_ON = true;

export default function Metronome() {

    const [totalTime, setTotalTime] = useState(0);
    const [isStop, setIsStop] = useState(true);

    const [showPicker, setShowPicker] = useState(false);
    const [alarmString, setAlarmString] = useState<string | null>("00:00:00");

    const [beatInterval, setBeatInterval] = useState(DEFAULT_BEAT_INTERVAL);
    const [beatCount, setBeatCount] = useState(DEFAULT_BEAT_COUNT);

    const [lastTotalTime, setLastTotalTiime] = useState();

    const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(DEFAULT_METRONOME_ON);
    const toggleMetronomeEnabled = () => setIsMetronomeEnabled(previousState => !previousState);

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
            const { sound } = await Audio.Sound.createAsync( require('../assets/sounds/end-bell.wav'));
            await sound.playAsync();
          }
        playSound()
    }
    useEffect(() => {
        

        // setTotalTime(pranayamaTimerAppData.lastTotalTime ? pranayamaTimerAppData.lastTotalTime : 0);

        const intervalid: any = setTimeout(() => {
          if (!isStop && totalTime >= 0) {
           setTotalTime(totalTime - 1);
           setBeatCount(beatCount + 1);
           if (beatCount % beatInterval === 0 && beatCount !== 0 && isMetronomeEnabled) {
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

      <View style={styles.metronomeTheme}>
        
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}>
            <View style={{alignItems: "center"}}>
                {alarmString !== null ? (
                    <Text style={styles.timerFace}>
                        {alarmString}
                    </Text>
                ) : null}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPicker(true)}>
                    <View style={{marginTop: 30}}>
                        <Text style={styles.timePicker}>
                            Set Time
                        </Text>
                    </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsStop(!isStop)}>
                    
                    <View style={{marginTop: 30}}>
                        <Text style={styles.startButton}>
                            {isStop === true ? "Start" : "Stop"}
                        </Text>
                    </View>
                    </TouchableOpacity>
                    <View><Text style={styles.metronome}>
                        Metronome Count (seconds)
                    </Text></View>
                    <View><Text style={styles.valueText}>
                        {beatInterval}
                    </Text></View>
                    <Slider
                        style={{width: 200, height: 40}}
                        minimumValue={1}
                        maximumValue={20}
                        step={1}
                        value={DEFAULT_BEAT_INTERVAL}
                        minimumTrackTintColor='#C3D8DB'
                        maximumTrackTintColor='#767577'
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
        <View><Text style={styles.valueText}>
                        Metronome {isMetronomeEnabled ? "On" : "Off"}
                    </Text></View>
   <Switch
    trackColor={{false: '#f4f3f4', true: '#767577'}}
    thumbColor={isMetronomeEnabled ? '#f4f3f4' : '#C3D8DB'}
    // ios_backgroundColor="#3e3e3e"
    onValueChange={toggleMetronomeEnabled}
    value={isMetronomeEnabled}
    />
    </View>
    );
}


const styles = StyleSheet.create({
    metronomeTheme: {
        // backgroundColor: '#DBD6D2',
        alignItems: "center", 
        justifyContent: "center",
    },
    timePicker: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderRadius: 10,
      fontSize: 16,
      overflow: "hidden",
      borderColor: "#65BABF",
      color: "#3670A5"
      },
      startButton: {
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderWidth: 1,
        borderRadius: 10,
        fontSize: 16,
        overflow: "hidden",
        borderColor: "#65BABF",
        color: "#3670A5"
        },
      metronome: {
        marginTop:30,
        paddingVertical: 10,
        paddingHorizontal: 18,
        fontSize: 16,
        overflow: "hidden",
        borderColor: "#65BABF",
        color: "#3670A5"
        },
        valueText: {
            
            paddingVertical: 10,
            paddingHorizontal: 18,
            fontSize: 16,
            fontWeight: 400,
            overflow: "hidden",
            borderColor: "#65BABF",
            color: "#3670A5"
            },
        timerFace: {
            marginTop:30,
            paddingVertical: 10,
            paddingHorizontal: 18,
            fontSize: 75,
            overflow: "hidden",
            borderColor: "#65BABF",
            color: "#3670A5"
            }
  });