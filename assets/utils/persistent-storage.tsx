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
  // Timer settings panel (durations, toggle, and sound selection)
  transitionPauseMs?: number;
  halfMarkPauseMs?: number;
  halfMarkEnabled?: boolean;
  transitionSound?: string;
  halfMarkSound?: string;
  // Pranayama: looping sound bed during long holds (Antara/Bahya Kumbhaka)
  holdAmbience?: string;
  // Breath timer (new pranayama)
  breathPatternId?: string;
  breathTotalSec?: number;
  breathAmbience?: string;
  breathClick?: string;
  /** Per-pattern user-edited counts, keyed by pattern id. */
  breathCustomCounts?: Record<
    string,
    { inhale: number; holdIn: number; exhale: number; holdOut: number }
  >;
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
