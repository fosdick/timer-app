import AsyncStorage from "@react-native-async-storage/async-storage";
type storageData = {
  key?: string;
  numberRounds?: number;
  workoutTime?: number;
  restTime?: number;
  yogaIntervalTime?: number;
  beatInterval?: number;
  beatCount?: number;
  totalTime?: number;
  yogaTotalInterval?: number;
  selectedFlowId?: string;
  durationMultiplier?: number;
  removeAds?: boolean;
  appUserId?: string;
  message?: string;
  // Timer settings panel (durations + toggle; sounds are NOT persisted)
  transitionPauseMs?: number;
  halfMarkPauseMs?: number;
  halfMarkEnabled?: boolean;
};
const storeData = async (key: string, value: Partial<storageData>) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch {
    // saving error
  }
};
const getData = async (key: string | undefined) => {
  if (key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch {
      // error reading value
    }
  }
};

export { storeData, getData };
