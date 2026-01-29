import {StyleSheet, Text, View} from 'react-native';

import { useEffect, useState} from 'react';

import { useKeepAwake } from 'expo-keep-awake';

import { Audio } from 'expo-av';
import { TouchableOpacity } from 'react-native';

Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
});

export default function Beats()  {

    const playBeat = () => {
        async function playSound() {
            console.log('Loading Sound');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            await Audio.Sound.createAsync( require('../assets/sounds/sticks-low-1.wav')
            );
            // setSound(sound);

            // console.log('Playing Sound', sound);
            // await sound.playAsync();
          }
        playSound()
        console.log('mock sound')
    }
    const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalid = setTimeout(() => {
      setCurrentTime(new Date());
      playBeat();
    }, 4000);
      return () => clearInterval(intervalid);
    });
  const formatedTime: string = currentTime.toLocaleString('en-US',{timeStyle: 'medium'});
  const [h, m, s] = formatedTime.split(/:|\s/);
//    console.log(formatedTime);

useKeepAwake();

  return (
    <View>
        <Text style={styles.clockFace}>{h}:{m}:{s}</Text>
        
        <TouchableOpacity onPress={() => {
            playBeat();
        }} >
            <Text>play</Text>
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    clockFace: {
      fontSize: 42,
      lineHeight: 60,
      fontWeight: '600'
    }
});


