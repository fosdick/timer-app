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


    const [totalTime, setTotalTime] = useState<number>(0);
    const [isStop, setIsStop] = useState<boolean>(true);
    const [numberRounds, setNumberRounds] = useState<number>(DEFAULT_NUMBER_ROUNDS);
    const [roundsRemaining, setRoundsRemaining] =useState<number>(DEFAULT_NUMBER_ROUNDS);

    const [totalIntervalTimeString, setTotalIntervalTimeString] = useState<string | null>("00:00:00");

    const [workoutIntervalValue, setWorkoutIntervalValue] = useState<any>('00:30');
    const [restIntervalValue, setRestIntervalValue] = useState<any>('00:30');

    const [initialWorkoutTotalTime, setInitialWorkoutTotalTime] = useState<number>(DEFAULT_WORKOUT_TIME);
    const [initialRestTotalTime, setInitialRestTotalTime] = useState<number>(DEFAULT_REST_TIME);

    const [currentWorkoutTotalTime, setCurrentWorkoutTotalTime] = useState<number>(DEFAULT_WORKOUT_TIME);
    const [currentRestTotalTime, setCurrentRestTotalTime] = useState<number>(DEFAULT_REST_TIME);

    const getTimeRemaining = () => {
        const remaining = totalTime;
        const minutes = Math.floor(remaining/ 60);
        const seconds = remaining % 60
        return {
            minutes, seconds
        }
    }


    useEffect(() => {
        
        setTotalTime((initialWorkoutTotalTime + initialRestTotalTime) * numberRounds);
        setTotalIntervalTimeString(formatTime(getTimeRemaining()));

        const intervalid: any = setTimeout(() => {
          if (!isStop && roundsRemaining >= 0) {
            setTotalIntervalTimeString(formatTime(getTimeRemaining()));
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
          
          
        }, 1000);
          return () => clearInterval(intervalid);
        });



    return (
    <View style={TimerStyles.metronomeTheme}>
         
        <Text>{JSON.stringify(isStop)}</Text>
        <Text>{JSON.stringify(roundsRemaining)}</Text>
        <Text>{JSON.stringify(currentWorkoutTotalTime )}</Text>
        <Text>{JSON.stringify(currentRestTotalTime)}</Text>
        <Text>{JSON.stringify(initialRestTotalTime)} ir</Text>

         <View style={TimerStyles.metronomeTheme}>
         <Text style={TimerStyles.metronome}>
                        Total Remaining
                        </Text>
              <Text style={TimerStyles.timerFace}>{totalIntervalTimeString}</Text>
         </View>

   
        <HittIntervalPicker textTitle='Workout' pickerDisplayTimeString={workoutIntervalValue}
            setIntervalValue={{setIntervalValue: setWorkoutIntervalValue}}
            setInitialTotalTime={{setInitialTotalTime:setInitialWorkoutTotalTime}}>
        </HittIntervalPicker>

        <HittIntervalPicker textTitle='Rest' pickerDisplayTimeString={restIntervalValue}
            setIntervalValue={{setIntervalValue: setRestIntervalValue}}
            setInitialTotalTime={{setInitialTotalTime:setInitialRestTotalTime}}>
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
                        onValueChange={(val) => setNumberRounds(val)}
                        onSlidingComplete={(val) => setNumberRounds(val)}
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