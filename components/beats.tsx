import {StyleSheet, Text, View} from 'react-native';

import { useEffect, useState} from 'react';

import { useKeepAwake } from 'expo-keep-awake';

import { Audio } from 'expo-av';

Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
});
import { TouchableOpacity } from 'react-native';
const SEC: number = 1000;


export default function Beats()  {
  
    const playBeat = () => {

        // const [sound, setSound] = useState();
    
        async function playSound() {
            console.log('Loading Sound');
            const { sound } = await Audio.Sound.createAsync( require('../assets/sounds/sticks-low-1.wav')
            );
            // setSound(sound);
        
            // console.log('Playing Sound', sound);
            // await sound.playAsync();
          }
        playSound()
        console.log('mock sound')
    }
    const [currentTime, setCurrentTime] = useState(new Date());
    const [count, setCount] = useState(4);
    

  useEffect(() => {
    const intervalid: any = setTimeout(() => {
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


