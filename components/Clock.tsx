import {StyleSheet, Text, View} from 'react-native';

import { useEffect, useState} from 'react';

// import { useKeepAwake } from 'expo-keep-awake';

export default function Clock()  {
  
    const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalid: any = setTimeout(() => {
      setCurrentTime(new Date());
    }, 1000);
      return () => clearInterval(intervalid);
    });
  const formatedTime: string = currentTime.toLocaleString('en-US',{timeStyle: 'medium'});
  const [h, m, s] = formatedTime.split(/:|\s/);
//    console.log(formatedTime);

// useKeepAwake();
  return (
    <View>
        <Text style={styles.clockFace}>{h}:{m}:{s}</Text>
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


