import { Audio } from "expo-av";

Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  interruptionModeIOS: 2,
});

export const playBeat = () => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/sticks-low-1.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
export const playEndChime = () => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/end-bell.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
export const playLevelComplete = () => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/yay-ending.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
export const playSnap = () => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/snap.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
export const playHittStart = () => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/hitt-start.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
export const playStart = () => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/350548__fairhavencollection__bell-hit.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
export const playYogaTransition = (): any => {
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../sounds/733936__creator_gt__swoosh-04.wav")
    );
    await sound.playAsync();
  }
  playSound();
};
