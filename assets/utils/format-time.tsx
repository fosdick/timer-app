import { TimerPickerProps } from "react-native-timer-picker";

export const formatTime = ({ hours, minutes, seconds }: TimeParts): string => {
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

export const formatMinutesSeonds = ({ hours, minutes, seconds }: TimeParts) => {
  const timeParts = [];
  if (minutes !== undefined) {
    timeParts.push(minutes.toString().padStart(2, "0"));
  }
  if (seconds !== undefined) {
    timeParts.push(seconds.toString().padStart(2, "0"));
  }
  return timeParts.join(":");
};

type TimeParts = {
  hours?: number;
  minutes?: number;
  seconds?: number;
};

export const getTimeParts = (totalTime: number): TimeParts => {
  const hours = Math.floor(totalTime / 3600);
  const minutes = (totalTime - hours * 3600) / 60;
  const seconds = totalTime % 60;
  return {
    hours,
    minutes,
    seconds,
  };
};
export const getTimePartsMinSec = (val: number) => {
  const minutes = Math.floor(val / 60);
  const seconds = val % 60;
  return {
    minutes,
    seconds,
  };
};
