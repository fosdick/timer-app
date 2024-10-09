import { useEffect, useState } from "react";

import { Text, TouchableOpacity, View } from "react-native";
import Slider from "@react-native-community/slider";

import { TimerStyles, GreenTheme } from "@/assets/styles/timer-app";
import { playLevelComplete, playHittStart } from "@/assets/utils/sounds";
import HittIntervalPicker from "@/components/hitt-time-picker";

import EventEmitter from "eventemitter3";

import {
  formatMinutesSeonds,
  formatTime,
  getTimePartsMinSec,
} from "../assets/utils/format-time";
import { getData, storeData } from "../assets/utils/persistant-storage";

export default function HittView() {
  const HITT_DATA_STORAGE_KEY = "hitt-data-storage-key";
  const DEFAULT_NUMBER_ROUNDS = 10;
  const DEFAULT_WORKOUT_TIME = 30;
  const DEFAULT_REST_TIME = 30;
  const TIMER_ENDED_EVENT_NAME = "hitt-timer-ended";

  const timerEndEvent = new EventEmitter();
  timerEndEvent.on(
    TIMER_ENDED_EVENT_NAME,
    () => {
      startTimerAgain();
    },
    {}
  );

  const [totalIntervalTimeString, setTotalIntervalTimeString] = useState<
    string | null
  >(
    formatMinutesSeonds(
      getTimePartsMinSec(
        DEFAULT_NUMBER_ROUNDS * (DEFAULT_WORKOUT_TIME + DEFAULT_REST_TIME)
      )
    )
  );

  const [workoutIntervalDisplayString, setWorkoutIntervalDisplayString] =
    useState<any>(
      formatMinutesSeonds(getTimePartsMinSec(DEFAULT_WORKOUT_TIME))
    );
  const [restIntervalDisplayString, setRestIntervalDisplayString] =
    useState<any>(formatMinutesSeonds(getTimePartsMinSec(DEFAULT_REST_TIME)));

  const [initialWorkoutTotalTime, setInitialWorkoutTotalTime] =
    useState<number>(DEFAULT_WORKOUT_TIME);
  const [initialRestTotalTime, setInitialRestTotalTime] =
    useState<number>(DEFAULT_REST_TIME);

  const [currentWorkoutTotalTime, setCurrentWorkoutTotalTime] =
    useState<number>(DEFAULT_WORKOUT_TIME);
  const [currentRestTotalTime, setCurrentRestTotalTime] =
    useState<number>(DEFAULT_REST_TIME);

  const [numberRounds, setNumberRounds] = useState<number>(
    DEFAULT_NUMBER_ROUNDS
  );
  const [roundsRemaining, setRoundsRemaining] = useState<number>(
    DEFAULT_NUMBER_ROUNDS
  );

  useState(async () => {
    const HITT_DATA_STORAGE_KEY = "hitt-data-storage-key";
    const persistantStorageData = await getData(HITT_DATA_STORAGE_KEY);

    setNumberRounds(
      persistantStorageData?.numberRounds || DEFAULT_NUMBER_ROUNDS
    );
    setRoundsRemaining(
      persistantStorageData?.numberRounds || DEFAULT_NUMBER_ROUNDS
    );
    setInitialWorkoutTotalTime(
      persistantStorageData?.workoutTime || DEFAULT_WORKOUT_TIME
    );
    setInitialRestTotalTime(
      persistantStorageData?.restTime || DEFAULT_REST_TIME
    );
    setWorkoutIntervalDisplayString(
      formatMinutesSeonds(
        getTimePartsMinSec(
          persistantStorageData?.workoutTime || DEFAULT_WORKOUT_TIME
        )
      )
    );
    setRestIntervalDisplayString(
      formatMinutesSeonds(
        getTimePartsMinSec(persistantStorageData?.restTime || DEFAULT_REST_TIME)
      )
    );
    setTotalIntervalTimeString(
      formatMinutesSeonds(
        getTimePartsMinSec(
          persistantStorageData?.numberRounds *
            (persistantStorageData?.workoutTime +
              persistantStorageData?.restTime)
        ) || totalIntervalTimeString
      )
    );
  });

  const getTimeRemaining = () => {
    const remaining = totalTime;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return {
      minutes,
      seconds,
    };
  };

  const [totalTime, setTotalTime] = useState<number>(0);
  const [isStop, setIsStop] = useState<boolean>(true);

  const resetInitalState = () => {
    const ms = (initialWorkoutTotalTime + initialRestTotalTime) * numberRounds;
    setTotalTime(ms);
    setTotalIntervalTimeString(formatTime(getTimePartsMinSec(ms)));
    setCurrentWorkoutTotalTime(initialWorkoutTotalTime);
    setCurrentRestTotalTime(initialRestTotalTime);
    storeData(HITT_DATA_STORAGE_KEY, {
      numberRounds: numberRounds,
      workoutTime: initialWorkoutTotalTime,
      restTime: initialRestTotalTime,
    });
  };
  const startTimerAgain = () => {
    setRoundsRemaining(numberRounds);
    setRestIntervalDisplayString(
      formatMinutesSeonds(getTimePartsMinSec(initialRestTotalTime))
    );
    setWorkoutIntervalDisplayString(
      formatMinutesSeonds(getTimePartsMinSec(initialWorkoutTotalTime))
    );
  };

  useEffect(() => {
    const intervalid: any = setTimeout(() => {
      if (!isStop && roundsRemaining >= 0 && totalTime >= 0) {
        setTotalTime(totalTime - 1);
        setTotalIntervalTimeString(formatTime(getTimeRemaining()));
        setWorkoutIntervalDisplayString(
          formatMinutesSeonds(getTimePartsMinSec(currentWorkoutTotalTime))
        );
        setRestIntervalDisplayString(
          formatMinutesSeonds(getTimePartsMinSec(currentRestTotalTime))
        );

        if (currentRestTotalTime === 0 && currentWorkoutTotalTime === 0) {
          setRoundsRemaining(roundsRemaining - 1);
          setCurrentWorkoutTotalTime(initialWorkoutTotalTime);
          setCurrentRestTotalTime(initialRestTotalTime);
          playHittStart();
        }

        if (currentWorkoutTotalTime > 0 && currentRestTotalTime > 0) {
          setCurrentWorkoutTotalTime(currentWorkoutTotalTime - 1);
        }
        if (
          currentWorkoutTotalTime === 0 &&
          currentRestTotalTime === initialRestTotalTime
        ) {
          playLevelComplete();
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
        resetInitalState();
        timerEndEvent.emit(TIMER_ENDED_EVENT_NAME);
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

      {/* <Text>{JSON.stringify(isStop)}</Text>
       
        <Text>{JSON.stringify(currentWorkoutTotalTime )}</Text>
        <Text>{JSON.stringify(workoutIntervalDisplayString )}wds</Text>
        <Text>{JSON.stringify(currentRestTotalTime)}</Text>
        <Text>{JSON.stringify(initialRestTotalTime)} ir</Text>
        <Text>{JSON.stringify(totalTime)} tot t</Text> */}

      <HittIntervalPicker
        textTitle="Workout"
        pickerDisplayTimeString={workoutIntervalDisplayString}
        setIntervalDisplayString={{
          setIntervalDisplayString: setWorkoutIntervalDisplayString,
        }}
        setInitialTotalTime={{
          setInitialTotalTime: setInitialWorkoutTotalTime,
        }}
        setCurrentTotalTime={{
          setCurrentTotalTime: setCurrentWorkoutTotalTime,
        }}
        resetInitalState={{ resetInitalState }}
        initialTotalTime={{ initialTotalTime: initialWorkoutTotalTime }}
      ></HittIntervalPicker>

      <HittIntervalPicker
        textTitle="Rest"
        pickerDisplayTimeString={restIntervalDisplayString}
        setIntervalDisplayString={{
          setIntervalDisplayString: setRestIntervalDisplayString,
        }}
        setInitialTotalTime={{ setInitialTotalTime: setInitialRestTotalTime }}
        setCurrentTotalTime={{ setCurrentTotalTime: setCurrentRestTotalTime }}
        resetInitalState={{ resetInitalState }}
        initialTotalTime={{ initialTotalTime: initialRestTotalTime }}
      ></HittIntervalPicker>

      {/* <View style={TimerStyles.metronomeTheme}>
        <Text style={TimerStyles.metronome}>Rounds Remaining :</Text>
        <Text style={TimerStyles.timerFace}>{roundsRemaining}</Text>
      </View> */}
      <View>
        <Text style={TimerStyles.metronome}>Rounds</Text>
      </View>
      <View>
        <Text style={TimerStyles.timerFaceSmall}>{roundsRemaining}</Text>
      </View>
      <Slider
        style={{ width: 200, height: 40 }}
        minimumValue={1}
        maximumValue={50}
        step={1}
        value={DEFAULT_NUMBER_ROUNDS}
        minimumTrackTintColor={GreenTheme.thumbColorEnabled}
        maximumTrackTintColor={GreenTheme.trackColorTrue}
        thumbTintColor={GreenTheme.trackColorTrue}
        onValueChange={(val) => {
          setIsStop(true);
          setNumberRounds(val);
          setRoundsRemaining(val);
          resetInitalState();
        }}
        onSlidingComplete={(val) => {
          setNumberRounds(val);
          setRoundsRemaining(val);
          resetInitalState();
        }}
      />

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (isStop) {
            playHittStart();
          }
          setIsStop(!isStop);
          //   resetInitalState();
        }}
      >
        <View style={TimerStyles.marginTop}>
          <Text style={TimerStyles.startButton}>
            {isStop === true ? "Start" : "Stop"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
