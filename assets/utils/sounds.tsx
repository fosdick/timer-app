    
    import { Audio } from 'expo-av';

    
Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
});

    export const playBeat = () => {
        async function playSound() {
            const { sound } = await Audio.Sound.createAsync( require('../sounds/sticks-low-1.wav'));
            await sound.playAsync();
          }
        playSound()
    }
    export const playEndChime = () => {
        async function playSound() {
            const { sound } = await Audio.Sound.createAsync( require('../sounds/end-bell.wav'));
            await sound.playAsync();
          }
        playSound()
    }
