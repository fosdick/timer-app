import AsyncStorage from "@react-native-async-storage/async-storage";
type storageData = {
  key: any;
  numberRounds: any;
  workoutTime: any;
  restTime: any;
  yogaIntervalTime: any;
  beatInterval: any;
  beatCount: any;
  totalTime: any;
};
const storeData = async (key: string, value: Partial<storageData>) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    // saving error
  }
};
const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};

export { storeData, getData };
