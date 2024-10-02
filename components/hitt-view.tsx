import {useEffect, useState} from 'react'

import {Text, TouchableOpacity, View} from 'react-native';
import Slider from '@react-native-community/slider';

import {TimerStyles} from '@/assets/styles/timer-app'

import HittIntervalPicker from '@/components/hitt-time-picker';

import { formatMinutesSeonds, formatTime} from "../assets/utils/format-time"

const DEFAULT_NUMBER_ROUNDS = 10;
const DEFAULT_WORKOUT_TIME = 2;
const DEFAULT_REST_TIME = 2;

export default function HittView() {


    const getTimeRemaining = () => {
        const remaining = totalTime;
        const minutes = Math.floor(remaining/ 60);
        const seconds = remaining % 60
        return {
            minutes, seconds
        }
    }
    const getTimePartsMinSec = (val:number) => {
        const minutes = Math.floor(val / 60);
        const seconds = val % 60
        return {
            minutes, seconds
        }
    }

    const [totalTime, setTotalTime] = useState<number>(0);
    const [isStop, setIsStop] = useState<boolean>(true);
    const [numberRounds, setNumberRounds] = useState<number>(DEFAULT_NUMBER_ROUNDS);
    const [roundsRemaining, setRoundsRemaining] =useState<number>(DEFAULT_NUMBER_ROUNDS);

    const [totalIntervalTimeString, setTotalIntervalTimeString] = useState<string | null>("00:00:00");

    const [workoutIntervalDisplayString, setWorkoutIntervalDisplayString] = useState<any>(formatMinutesSeonds(getTimePartsMinSec(DEFAULT_WORKOUT_TIME)));
    const [restIntervalDisplayString, setRestIntervalDisplayString] = useState<any>(formatMinutesSeonds(getTimePartsMinSec(DEFAULT_REST_TIME)));

    const [initialWorkoutTotalTime, setInitialWorkoutTotalTime] = useState<number>(DEFAULT_WORKOUT_TIME);
    const [initialRestTotalTime, setInitialRestTotalTime] = useState<number>(DEFAULT_REST_TIME);

    const [currentWorkoutTotalTime, setCurrentWorkoutTotalTime] = useState<number>(DEFAULT_WORKOUT_TIME);
    const [currentRestTotalTime, setCurrentRestTotalTime] = useState<number>(DEFAULT_REST_TIME);

    const resetInitalState = () => {
        const ms = (initialWorkoutTotalTime + initialRestTotalTime) * numberRounds;
        setTotalTime(ms);
        setTotalIntervalTimeString(formatTime(getTimePartsMinSec(ms)));
        setCurrentWorkoutTotalTime(initialWorkoutTotalTime);
        setCurrentRestTotalTime(initialRestTotalTime);
    }
    


    useEffect(() => {
        
        const intervalid: any = setTimeout(() => {
            
          if (!isStop && roundsRemaining >= 0 && totalTime >= 0) {
            setTotalTime(totalTime - 1);
            setTotalIntervalTimeString(formatTime(getTimeRemaining()));
            setWorkoutIntervalDisplayString(formatMinutesSeonds(getTimePartsMinSec(currentWorkoutTotalTime)));
            setRestIntervalDisplayString(formatMinutesSeonds(getTimePartsMinSec(currentRestTotalTime)))

           if (currentRestTotalTime === 0 && currentWorkoutTotalTime === 0) {
            setRoundsRemaining(roundsRemaining - 1);
            setCurrentWorkoutTotalTime(initialWorkoutTotalTime);
            setCurrentRestTotalTime(initialRestTotalTime);
           }

           if (currentWorkoutTotalTime > 0 && currentRestTotalTime > 0) {
            setCurrentWorkoutTotalTime(currentWorkoutTotalTime - 1);
          }
          
           if (currentWorkoutTotalTime === 0 && currentRestTotalTime > 0) {
            setCurrentRestTotalTime(currentRestTotalTime - 1);
           }
           
        }
        if (totalTime < 0) {
            setTotalTime(0);
        }
        if (roundsRemaining === 0) {
            setIsStop(true);
        }
          
          
        }, 1000);
          return () => clearInterval(intervalid);
        });


    return (
    <View style={TimerStyles.metronomeTheme}>
        <View style={TimerStyles.metronomeTheme}>
         <Text style={TimerStyles.metronome}>
                        Total Remaining : {totalIntervalTimeString}
                        </Text>
         </View>

           <View style={TimerStyles.metronomeTheme}>
         <Text style={TimerStyles.metronome}>
                        Rounds Remaining : 
                        </Text>
              <Text style={TimerStyles.timerFace}>{roundsRemaining}</Text>
         </View>
        {/* <Text>{JSON.stringify(isStop)}</Text>
       
        <Text>{JSON.stringify(currentWorkoutTotalTime )}</Text>
        <Text>{JSON.stringify(workoutIntervalDisplayString )}wds</Text>
        <Text>{JSON.stringify(currentRestTotalTime)}</Text>
        <Text>{JSON.stringify(initialRestTotalTime)} ir</Text>
        <Text>{JSON.stringify(totalTime)} tot t</Text> */}

         
   
        <HittIntervalPicker textTitle='Workout' pickerDisplayTimeString={workoutIntervalDisplayString}
            setIntervalDisplayString={{setIntervalDisplayString: setWorkoutIntervalDisplayString}}
            setInitialTotalTime={{setInitialTotalTime:setInitialWorkoutTotalTime}}
            setCurrentTotalTime={{setCurrentTotalTime:setCurrentWorkoutTotalTime}}
            updateValue={{updateValue: resetInitalState}}>
        </HittIntervalPicker>

        <HittIntervalPicker textTitle='Rest' pickerDisplayTimeString={restIntervalDisplayString}
            setIntervalDisplayString={{setIntervalDisplayString: setRestIntervalDisplayString}}
            setInitialTotalTime={{setInitialTotalTime:setInitialRestTotalTime}}
            setCurrentTotalTime={{setCurrentTotalTime:setCurrentRestTotalTime}}
            updateValue={{updateValue: resetInitalState}}>
        </HittIntervalPicker>
   
      
                    <View>
                        <Text style={TimerStyles.metronome}>
                        Number of Rounds
                        </Text>
                    </View>
                    <View>
                        <Text style={TimerStyles.valueText}>
                        {numberRounds}
                        </Text>
                    </View>
                    <Slider
                        style={{width: 200, height: 40}}
                        minimumValue={1}
                        maximumValue={50}
                        step={1}
                        value={DEFAULT_NUMBER_ROUNDS}
                        minimumTrackTintColor='#C3D8DB'
                        maximumTrackTintColor='#767577'
                        onValueChange={(val) => {setIsStop(true); setNumberRounds(val); setRoundsRemaining(val); resetInitalState()}}
                        onSlidingComplete={(val) => {setNumberRounds(val); setRoundsRemaining(val); resetInitalState()}}
                    />


                    <TouchableOpacity
                     activeOpacity={0.7}
                    onPress={() => setIsStop(!isStop)}>
                     <View style={TimerStyles.marginTop}>
                        <Text style={TimerStyles.startButton}>
                            {isStop === true ? "Start" : "Stop"}
                        </Text>
                    </View>
                    </TouchableOpacity>


    </View>
    )

}