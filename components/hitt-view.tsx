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
  const RESET_ALL_EVENT = "reset-all-event";

  const hittTimerEventController = new EventEmitter();
  hittTimerEventController.on(
    TIMER_ENDED_EVENT_NAME,
    () => {
      startTimerAgain();
    },
    {}
  );
  const [doResetAll, setDoResetAll] = useState<boolean>(false);
  hittTimerEventController.on(
    RESET_ALL_EVENT,
    () => {
      setDoResetAll(true);
    },
    {}
  );
  const resetAllEmit = () => {
    hittTimerEventController.emit(RESET_ALL_EVENT);
  };
  const [totalIntervalTimeString, setTotalIntervalTimeString] = useState<any>(
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

    setNumberRounds(persistantStorageData?.numberRounds || numberRounds);
    setRoundsRemaining(persistantStorageData?.numberRounds || numberRounds);
    setInitialWorkoutTotalTime(
      persistantStorageData?.workoutTime || initialWorkoutTotalTime
    );
    setInitialRestTotalTime(
      persistantStorageData?.restTime || initialRestTotalTime
    );
    setWorkoutIntervalDisplayString(
      formatMinutesSeonds(
        getTimePartsMinSec(
          persistantStorageData?.workoutTime || initialWorkoutTotalTime
        )
      )
    );
    setRestIntervalDisplayString(
      formatMinutesSeonds(
        getTimePartsMinSec(
          persistantStorageData?.restTime || initialRestTotalTime
        )
      )
    );
    setTotalIntervalTimeString(
      formatMinutesSeonds(
        getTimePartsMinSec(
          persistantStorageData?.numberRounds *
            (persistantStorageData?.workoutTime +
              persistantStorageData?.restTime) ||
            numberRounds * (initialWorkoutTotalTime + initialRestTotalTime)
        )
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

  const resetInitalState = ({
    _initialWorkoutTotalTime,
    _initialRestTotalTime,
    _numberRounds,
  }: any) => {
    const ms =
      ((_initialWorkoutTotalTime || initialWorkoutTotalTime) +
        (_initialRestTotalTime || initialRestTotalTime)) *
      (_numberRounds || numberRounds);
    setTotalTime(ms);
    setTotalIntervalTimeString(formatTime(getTimePartsMinSec(ms)));
    setCurrentWorkoutTotalTime(
      _initialWorkoutTotalTime || initialWorkoutTotalTime
    );
    setCurrentRestTotalTime(_initialRestTotalTime || initialRestTotalTime);
    setWorkoutIntervalDisplayString(
      formatMinutesSeonds(
        getTimePartsMinSec(_initialWorkoutTotalTime || initialWorkoutTotalTime)
      )
    );
    setRestIntervalDisplayString(
      formatMinutesSeonds(
        getTimePartsMinSec(_initialRestTotalTime || initialRestTotalTime)
      )
    );
    storeData(HITT_DATA_STORAGE_KEY, {
      numberRounds: _numberRounds || numberRounds,
      workoutTime: _initialWorkoutTotalTime || initialWorkoutTotalTime,
      restTime: _initialRestTotalTime || initialRestTotalTime,
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
    setIsStop(true);
  };

  useEffect(() => {
    if (doResetAll) {
      resetInitalState({
        _initialWorkoutTotalTime: initialWorkoutTotalTime,
        _initialRestTotalTime: initialRestTotalTime,
        _numberRounds: numberRounds,
      });
      setRoundsRemaining(numberRounds);
      setIsStop(true);
      setDoResetAll(false);
    }
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
        resetInitalState({
          _initialWorkoutTotalTime: initialWorkoutTotalTime,
          _initialRestTotalTime: initialRestTotalTime,
          _numberRounds: numberRounds,
        });
        hittTimerEventController.emit(TIMER_ENDED_EVENT_NAME);
      }
    }, 1000);
    return () => clearInterval(intervalid);
  });

  return (
    <View style={TimerStyles.metronomeTheme}>
      <View>
        <Text style={TimerStyles.metronomeMedium}>
          <Text style={TimerStyles.metronome}>Total: </Text>
          {totalIntervalTimeString}
        </Text>
      </View>

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
        resetAllEmit={{ resetAllEmit }}
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
        resetAllEmit={{ resetAllEmit }}
        initialTotalTime={{ initialTotalTime: initialRestTotalTime }}
      ></HittIntervalPicker>
      <View>
        <Text style={TimerStyles.metronome}>Rounds</Text>
      </View>
      <View>
        <Text style={TimerStyles.timerFace}>{roundsRemaining}</Text>
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
          setNumberRounds(val);
          setRoundsRemaining(val);
          resetInitalState({
            _initialWorkoutTotalTime: initialWorkoutTotalTime,
            _initialRestTotalTime: initialRestTotalTime,
            _numberRounds: val,
          });
        }}
        onSlidingComplete={(val) => {
          setNumberRounds(val);
          setRoundsRemaining(val);
          resetInitalState({
            _initialWorkoutTotalTime: initialWorkoutTotalTime,
            _initialRestTotalTime: initialRestTotalTime,
            _numberRounds: val,
          });
          setIsStop(true);
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
